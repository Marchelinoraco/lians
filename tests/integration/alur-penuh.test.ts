import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const IP_UJI = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
const authMock = vi.fn();

vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-forwarded-for', IP_UJI]]) as unknown as Headers,
}));

const { db } = await import('@/db');
const { vehicles, bookings, rateLimits } = await import('@/db/schema');
const { createVehicle, updateVehicle, deleteVehicle } = await import('@/actions/admin-vehicles');
const { createBooking } = await import('@/actions/booking');
const { updateBookingStatus } = await import('@/actions/admin-bookings');
const { getPublishedVehicles, getVehicleBySlug } = await import('@/queries/vehicles');
const { getBookings } = await import('@/queries/bookings');
const { getSettings } = await import('@/queries/settings');
const { pickLocale } = await import('@/i18n/localized');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;

const bersih = { kendaraan: [] as string[], pesanan: [] as string[] };

const iso = (d: Date) => d.toISOString().slice(0, 10);
const besok = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d;
};
const tambahHari = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/**
 * Satu alur utuh, persis seperti yang akan dijalani LIANS setiap hari:
 * staf menambah mobil di admin → mobil tampil di katalog publik →
 * customer memesan → pesanan muncul di admin → staf mengonfirmasi.
 */
jalankan('alur penuh: admin → publik → booking → admin', () => {
  const nama = `Alur Penuh ${Date.now()}`;
  let vehicleId = '';
  let bookingCode = '';

  it('1. staf menambah kendaraan lewat panel admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'staf', email: 'staf@lians.id' } });

    const hasil = await createVehicle({
      name: nama,
      category: 'mpv',
      rate24h: 800000,
      rate12h: 600000,
      serviceTypes: ['self-drive', 'with-driver'],
      seats: 7,
      transmission: 'automatic',
      fuelType: 'petrol',
      year: 2024,
      luggage: 3,
      images: [],
      features: { id: ['AC Dingin'], en: ['Cold AC'] },
      rentalTerms: { id: ['Jaminan KTP'] },
      status: 'available',
      isPublished: true,
      sortOrder: 500,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    vehicleId = hasil.data.id;
    bersih.kendaraan.push(vehicleId);
  });

  it('2. kendaraan langsung tampil di katalog publik dalam empat bahasa', async () => {
    const katalog = await getPublishedVehicles();
    const v = katalog.find((x) => x.id === vehicleId);
    expect(v).toBeTruthy();
    if (!v) return;

    expect(pickLocale(v.features, 'en')).toEqual(['Cold AC']);
    // Mandarin belum diterjemahkan, jadi harus jatuh ke bahasa Indonesia.
    expect(pickLocale(v.features, 'zh')).toEqual(['AC Dingin']);
    expect(await getVehicleBySlug(v.slug)).toBeTruthy();
  });

  it('3. customer memesan 5 hari dengan sopir 3 hari', async () => {
    const mulai = besok();
    const settings = await getSettings();

    const hasil = await createBooking({
      serviceType: 'with-driver',
      vehicleId,
      startDate: iso(mulai),
      endDate: iso(tambahHari(mulai, 5)),
      rateType: '24h',
      driverDays: 3,
      customerName: 'Pelanggan Alur',
      phone: '081234567890',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    bookingCode = hasil.data.bookingCode;

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, bookingCode))
      .limit(1);
    bersih.pesanan.push(row.id);

    expect(row.totalPrice).toBe(5 * 800000 + 3 * settings.driverFeePerDay);
    expect(row.status).toBe('pending');
    expect(decodeURIComponent(hasil.data.whatsappUrl)).toContain(bookingCode);
  });

  it('4. pesanan muncul di daftar admin dengan status menunggu', async () => {
    const pending = await getBookings('pending');
    expect(pending.some((b) => b.bookingCode === bookingCode)).toBe(true);
  });

  it('5. staf mengonfirmasi pesanan', async () => {
    authMock.mockResolvedValue({ user: { id: 'staf', email: 'staf@lians.id' } });
    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, bookingCode))
      .limit(1);

    expect(await updateBookingStatus(row.id, 'confirmed')).toMatchObject({ ok: true });

    const [sesudah] = await db.select().from(bookings).where(eq(bookings.id, row.id));
    expect(sesudah.status).toBe('confirmed');
  });

  it('6. menaikkan tarif tidak mengubah harga pesanan yang sudah masuk', async () => {
    authMock.mockResolvedValue({ user: { id: 'staf', email: 'staf@lians.id' } });

    const sebelum = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, bookingCode))
      .limit(1);
    const hargaAsli = sebelum[0].totalPrice;

    await updateVehicle(vehicleId, {
      name: nama,
      category: 'mpv',
      rate24h: 2_000_000,
      rate12h: 600000,
      serviceTypes: ['self-drive'],
      seats: 7,
      transmission: 'automatic',
      fuelType: 'petrol',
      year: 2024,
      luggage: 3,
      images: [],
      features: { id: ['AC Dingin'] },
      rentalTerms: { id: ['Jaminan KTP'] },
      status: 'available',
      isPublished: true,
      sortOrder: 500,
    });

    const [sesudah] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, bookingCode))
      .limit(1);

    expect(sesudah.totalPrice).toBe(hargaAsli);
    expect(sesudah.priceBreakdown?.ratePerDay).toBe(800000);
  });

  it('7. menghapus kendaraan tidak menghapus riwayat pesanannya', async () => {
    authMock.mockResolvedValue({ user: { id: 'staf', email: 'staf@lians.id' } });
    expect(await deleteVehicle(vehicleId)).toMatchObject({ ok: true });
    bersih.kendaraan = bersih.kendaraan.filter((id) => id !== vehicleId);

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, bookingCode))
      .limit(1);

    expect(row).toBeTruthy();
    expect(row.vehicleId).toBeNull();
    // Nama kendaraan tetap terbaca karena disimpan sebagai salinan beku.
    expect(row.vehicleNameSnapshot).toBe(nama);
    expect(row.totalPrice).toBe(5 * 800000 + 450000);
  });
});

afterAll(async () => {
  for (const id of bersih.pesanan) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of bersih.kendaraan) await db.delete(vehicles).where(eq(vehicles.id, id));
  await db.delete(rateLimits).where(eq(rateLimits.key, `booking:${IP_UJI}`));
});
