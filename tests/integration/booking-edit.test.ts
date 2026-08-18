import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { bookings, customers, suppliers } = await import('@/db/schema');
const { createManualBooking } = await import('@/actions/admin-manual-booking');
const { updateBooking } = await import('@/actions/admin-booking-edit');
const { createSupplier, addSupplierVehicle } = await import('@/actions/admin-suppliers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const pesananDibuat: string[] = [];
const pemasokDibuat: string[] = [];
const pelangganDibuat = new Set<string>();
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

async function catat(id: string) {
  pesananDibuat.push(id);
  const [row] = await db
    .select({ customerId: bookings.customerId })
    .from(bookings)
    .where(eq(bookings.id, id));
  if (row?.customerId) pelangganDibuat.add(row.customerId);
  return id;
}

/** Isian minimum yang sah — tes menimpanya seperlunya. */
const dasar = {
  customerName: 'Grace Tumbelaka',
  serviceType: 'with-driver' as const,
  itemName: 'Innova + sopir',
  startDate: '2099-09-01',
  totalPrice: 3600000,
  asalKendaraan: 'sendiri' as const,
};

async function buatManual(over: Record<string, unknown> = {}) {
  bersesi();
  const hasil = await createManualBooking({ ...dasar, phone: nomorUji(), ...over });
  if (!hasil.ok) throw new Error(`gagal membuat pesanan uji: ${hasil.message}`);
  await catat(hasil.data.id);
  return hasil.data.id;
}

async function siapkanPemasok() {
  bersesi();
  const p = await createSupplier({ name: `Pemasok Ubah ${Date.now()}` });
  if (!p.ok) throw new Error('gagal membuat pemasok uji');
  pemasokDibuat.push(p.data.id);
  const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Hiace Pinjaman' });
  if (!k.ok) throw new Error('gagal membuat kendaraan pemasok uji');
  return { supplierId: p.data.id, supplierVehicleId: k.data.id };
}

async function baca(id: string) {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id));
  return row;
}

jalankan('ubah booking', () => {
  it('menolak tanpa sesi', async () => {
    const id = await buatManual();
    authMock.mockResolvedValue(null);

    const hasil = await updateBooking(id, { ...dasar, phone: nomorUji() });

    expect(hasil.ok).toBe(false);
  });

  it('menolak mengubah pesanan yang sudah selesai', async () => {
    const id = await buatManual();
    await db.update(bookings).set({ status: 'completed' }).where(eq(bookings.id, id));
    bersesi();

    const hasil = await updateBooking(id, { ...dasar, phone: nomorUji(), totalPrice: 9999999 });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.message).toMatch(/selesai/i);
    expect((await baca(id)).totalPrice).toBe(3600000);
  });

  it('mengizinkan perubahan pada pesanan yang dibatalkan', async () => {
    const id = await buatManual();
    await db.update(bookings).set({ status: 'cancelled' }).where(eq(bookings.id, id));
    bersesi();

    const hasil = await updateBooking(id, { ...dasar, phone: nomorUji(), totalPrice: 100000 });

    expect(hasil.ok).toBe(true);
    expect((await baca(id)).totalPrice).toBe(100000);
  });

  it('menyimpan harga, tanggal, dan keterangan yang diubah', async () => {
    const id = await buatManual();
    bersesi();

    const hasil = await updateBooking(id, {
      ...dasar,
      phone: nomorUji(),
      itemName: 'Hiace Commuter, paket 5 hari',
      startDate: '2099-10-01',
      endDate: '2099-10-05',
      totalPrice: 5000000,
    });

    expect(hasil.ok).toBe(true);
    const row = await baca(id);
    expect(row.vehicleNameSnapshot).toBe('Hiace Commuter, paket 5 hari');
    expect(row.startDate).toBe('2099-10-01');
    expect(row.endDate).toBe('2099-10-05');
    expect(row.totalPrice).toBe(5000000);
  });

  it('menyimpan biaya operasional pada kendaraan milik LIANS sendiri', async () => {
    const id = await buatManual();
    bersesi();

    const hasil = await updateBooking(id, {
      ...dasar,
      phone: nomorUji(),
      costFuel: 400000,
      costDriver: 250000,
      costTollParking: 75000,
      costOther: 25000,
      costOtherNote: 'Cuci mobil',
    });

    expect(hasil.ok).toBe(true);
    const row = await baca(id);
    expect(row.costFuel).toBe(400000);
    expect(row.costDriver).toBe(250000);
    expect(row.costTollParking).toBe(75000);
    expect(row.costOther).toBe(25000);
    expect(row.costOtherNote).toBe('Cuci mobil');
  });

  // Inti permintaannya: mobil pinjaman tidak membuat BBM dan sopir jadi gratis.
  it('menyimpan biaya operasional terpisah dari biaya sewa ke pemasok', async () => {
    const { supplierVehicleId } = await siapkanPemasok();
    const id = await buatManual();
    bersesi();

    const hasil = await updateBooking(id, {
      ...dasar,
      phone: nomorUji(),
      totalPrice: 3600000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 2000000,
      costFuel: 400000,
      costDriver: 250000,
    });

    expect(hasil.ok).toBe(true);
    const row = await baca(id);
    expect(row.supplierCost).toBe(2000000);
    expect(row.supplierNameSnapshot).toBeTruthy();
    expect(row.costFuel).toBe(400000);
    expect(row.costDriver).toBe(250000);
  });

  it('mengosongkan data pemasok saat kendaraan dikembalikan ke milik sendiri', async () => {
    const { supplierVehicleId } = await siapkanPemasok();
    const id = await buatManual({
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 1000000,
    });
    bersesi();

    const hasil = await updateBooking(id, { ...dasar, phone: nomorUji() });

    expect(hasil.ok).toBe(true);
    const row = await baca(id);
    expect(row.supplierVehicleId).toBeNull();
    expect(row.supplierCost).toBeNull();
    expect(row.supplierNameSnapshot).toBeNull();
  });

  it('menautkan ulang ke pelanggan lain saat nomor WhatsApp diganti', async () => {
    const id = await buatManual();
    const sebelum = (await baca(id)).customerId;
    bersesi();

    const hasil = await updateBooking(id, {
      ...dasar,
      customerName: 'Denny Wowor',
      phone: nomorUji(),
    });

    expect(hasil.ok).toBe(true);
    const row = await baca(id);
    if (row.customerId) pelangganDibuat.add(row.customerId);
    expect(row.customerId).not.toBe(sebelum);
    expect(row.customerName).toBe('Denny Wowor');
  });

  it('mempertahankan rincian harga asli dan menandai harga pesanan situs yang diubah', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-UJI-${Date.now()}`,
        customerName: 'Pelanggan Situs',
        phone: '6281200000001',
        serviceType: 'self-drive',
        vehicleNameSnapshot: 'Avanza',
        startDate: '2099-09-01',
        totalPrice: 1500000,
        priceBreakdown: { category: 'lepas-kunci', days: 3, ratePerDay: 500000, total: 1500000 },
        status: 'confirmed',
        source: 'website',
      })
      .returning({ id: bookings.id });
    await catat(row.id);
    bersesi();

    const hasil = await updateBooking(row.id, {
      ...dasar,
      customerName: 'Pelanggan Situs',
      phone: '6281200000001',
      itemName: 'Avanza',
      totalPrice: 1200000,
    });

    expect(hasil.ok).toBe(true);
    const sesudah = await baca(row.id);
    expect(sesudah.totalPrice).toBe(1200000);
    // Harga yang pernah dilihat pelanggan tidak boleh hilang dari riwayat.
    expect(sesudah.priceBreakdown).toMatchObject({ total: 1500000 });
    expect(sesudah.priceEditedAt).toBeInstanceOf(Date);
  });

  it('tidak menandai diubah bila totalnya tidak disentuh', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-UJI-${Date.now()}-b`,
        customerName: 'Pelanggan Situs',
        phone: '6281200000002',
        serviceType: 'self-drive',
        vehicleNameSnapshot: 'Brio',
        startDate: '2099-09-01',
        totalPrice: 900000,
        priceBreakdown: { category: 'lepas-kunci', days: 2, ratePerDay: 450000, total: 900000 },
        status: 'pending',
        source: 'website',
      })
      .returning({ id: bookings.id });
    await catat(row.id);
    bersesi();

    const hasil = await updateBooking(row.id, {
      ...dasar,
      customerName: 'Pelanggan Situs',
      phone: '6281200000002',
      itemName: 'Brio',
      totalPrice: 900000,
      costFuel: 150000,
    });

    expect(hasil.ok).toBe(true);
    const sesudah = await baca(row.id);
    expect(sesudah.costFuel).toBe(150000);
    expect(sesudah.priceEditedAt).toBeNull();
  });

  // Sisa kolom di basis data menyimpan "kosong" sebagai null. Satu kolom yang
  // menyimpannya sebagai string kosong membuat setiap kueri harus memeriksa dua
  // bentuk kekosongan, dan yang lupa memeriksa keduanya diam-diam salah hitung.
  it('menyimpan catatan yang dikosongkan sebagai null, bukan string kosong', async () => {
    const id = await buatManual({ notes: 'Titip di bandara', adminNotes: 'Pelanggan lama' });
    bersesi();

    const hasil = await updateBooking(id, { ...dasar, phone: nomorUji(), notes: '', adminNotes: '' });

    expect(hasil.ok).toBe(true);
    const row = await baca(id);
    expect(row.notes).toBeNull();
    expect(row.adminNotes).toBeNull();
  });

  it('tidak mengubah status pesanan', async () => {
    const id = await buatManual();
    await db.update(bookings).set({ status: 'pending' }).where(eq(bookings.id, id));
    bersesi();

    await updateBooking(id, { ...dasar, phone: nomorUji() });

    expect((await baca(id)).status).toBe('pending');
  });
});

afterAll(async () => {
  for (const id of pesananDibuat) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of pelangganDibuat) await db.delete(customers).where(eq(customers.id, id));
  for (const id of pemasokDibuat) await db.delete(suppliers).where(eq(suppliers.id, id));
});
