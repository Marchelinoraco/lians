import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

// IP diacak per proses agar pembatas laju tidak menolak tes saat dijalankan berulang.
const IP_UJI = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;

vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-forwarded-for', IP_UJI]]) as unknown as Headers,
}));

const { db } = await import('@/db');
const { bookings, rateLimits } = await import('@/db/schema');
const { createBooking } = await import('@/actions/booking');
const { getPublishedVehicles } = await import('@/queries/vehicles');
const { getPublishedRoutes } = await import('@/queries/routes');
const { getSettings } = await import('@/queries/settings');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const iso = (d: Date) => d.toISOString().slice(0, 10);
const besok = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};
const plusHari = (dari: Date, n: number) => {
  const d = new Date(dari);
  d.setDate(d.getDate() + n);
  return d;
};

jalankan('createBooking', () => {
  it('menyimpan pesanan sewa dan menghitung harga dari tarif di database', async () => {
    const [mobil] = (await getPublishedVehicles()).filter((v) => v.status === 'available');
    const settings = await getSettings();
    const mulai = besok();

    const hasil = await createBooking({
      serviceType: 'with-driver',
      vehicleId: mobil.id,
      startDate: iso(mulai),
      endDate: iso(plusHari(mulai, 5)),
      rateType: '24h',
      driverDays: 3,
      customerName: 'Uji Otomatis',
      phone: '081234567890',
      email: '',
      notes: '',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.data.bookingCode).toMatch(/^LNS-\d{8}-[A-Z2-9]{4}$/);

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, hasil.data.bookingCode))
      .limit(1);
    dibuat.push(row.id);

    // Persis kasus yang diminta pemilik: sewa 5 hari, sopir 3 hari.
    expect(row.status).toBe('pending');
    expect(row.priceBreakdown?.days).toBe(5);
    expect(row.priceBreakdown?.rentalCost).toBe(5 * mobil.rate24h);
    expect(row.priceBreakdown?.driverCost).toBe(3 * settings.driverFeePerDay);
    expect(row.totalPrice).toBe(5 * mobil.rate24h + 3 * settings.driverFeePerDay);
  });

  it('mengabaikan harga yang dikirim browser dan memakai tarif database', async () => {
    const [mobil] = (await getPublishedVehicles()).filter((v) => v.status === 'available');
    const mulai = besok();

    const hasil = await createBooking({
      serviceType: 'self-drive',
      vehicleId: mobil.id,
      startDate: iso(mulai),
      endDate: iso(plusHari(mulai, 1)),
      rateType: '24h',
      driverDays: 0,
      customerName: 'Uji Curang',
      phone: '081234567890',
      // Angka-angka ini sengaja dikirim untuk mencoba menipu server.
      totalPrice: 1,
      priceBreakdown: { total: 1 },
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, hasil.data.bookingCode))
      .limit(1);
    dibuat.push(row.id);

    expect(row.totalPrice).toBe(mobil.rate24h);
    expect(row.totalPrice).not.toBe(1);
  });

  it('menolak hari sopir yang melebihi durasi sewa', async () => {
    const [mobil] = (await getPublishedVehicles()).filter((v) => v.status === 'available');
    const mulai = besok();

    const hasil = await createBooking({
      serviceType: 'with-driver',
      vehicleId: mobil.id,
      startDate: iso(mulai),
      endDate: iso(plusHari(mulai, 2)),
      rateType: '24h',
      driverDays: 9,
      customerName: 'Uji Tolak',
      phone: '081234567890',
    });

    expect(hasil.ok).toBe(false);
  });

  it('menolak nomor telepon yang bukan format Indonesia', async () => {
    const [mobil] = (await getPublishedVehicles()).filter((v) => v.status === 'available');
    const mulai = besok();

    const hasil = await createBooking({
      serviceType: 'self-drive',
      vehicleId: mobil.id,
      startDate: iso(mulai),
      endDate: iso(plusHari(mulai, 1)),
      rateType: '24h',
      driverDays: 0,
      customerName: 'Uji',
      phone: '12345',
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.phone?.[0]).toMatch(/telepon/i);
  });

  it('menyimpan pesanan travel tanpa tanggal selesai dan tanpa tarif bila rute belum bertarif', async () => {
    const rute = (await getPublishedRoutes()).find((r) => r.price === null);
    expect(rute).toBeTruthy();
    if (!rute) return;

    const hasil = await createBooking({
      serviceType: 'travel',
      routeId: rute.id,
      startDate: iso(besok()),
      customerName: 'Uji Travel',
      phone: '081234567890',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, hasil.data.bookingCode))
      .limit(1);
    dibuat.push(row.id);

    expect(row.endDate).toBeNull();
    expect(row.rateType).toBeNull();
    expect(row.totalPrice).toBeNull();
    expect(row.routeNameSnapshot).toContain(rute.destination);
    expect(decodeURIComponent(hasil.data.whatsappUrl)).toMatch(/menunggu penawaran harga/i);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(bookings).where(eq(bookings.id, id));
  await db.delete(rateLimits).where(eq(rateLimits.key, `booking:${IP_UJI}`));
});
