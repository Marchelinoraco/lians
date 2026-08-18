import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { bookings, customers, suppliers, vehicles } = await import('@/db/schema');
const { createManualBooking, updateSupplierPaid } = await import('@/actions/admin-manual-booking');
const { createSupplier, addSupplierVehicle } = await import('@/actions/admin-suppliers');
const { getUtangPemasok } = await import('@/queries/suppliers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const pesananDibuat: string[] = [];
const pemasokDibuat: string[] = [];
const pelangganDibuat = new Set<string>();
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

/** Mencatat pesanan sekaligus pelanggan yang lahir darinya, agar ikut dibersihkan. */
async function catat(id: string) {
  pesananDibuat.push(id);
  const [row] = await db
    .select({ customerId: bookings.customerId })
    .from(bookings)
    .where(eq(bookings.id, id));
  if (row?.customerId) pelangganDibuat.add(row.customerId);
}

async function siapkanPemasok() {
  bersesi();
  const p = await createSupplier({ name: `Pemasok Manual ${Date.now()}` });
  if (!p.ok) throw new Error('gagal membuat pemasok uji');
  pemasokDibuat.push(p.data.id);

  const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Avanza Pinjaman' });
  if (!k.ok) throw new Error('gagal membuat kendaraan pemasok uji');
  return { supplierId: p.data.id, supplierVehicleId: k.data.id };
}

jalankan('booking manual', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const hasil = await createManualBooking({
      customerName: 'Tak Boleh',
      phone: nomorUji(),
      serviceType: 'self-drive',
      itemName: 'Avanza',
      startDate: '2099-09-01',
      totalPrice: 500000,
      asalKendaraan: 'sendiri',
    });
    expect(hasil.ok).toBe(false);
  });

  it('menyimpan harga yang diketik admin apa adanya, tanpa menghitung dari tanggal', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Pelanggan Manual',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Innova + sopir, paket khusus',
      startDate: '2099-09-01',
      endDate: '2099-09-10',
      totalPrice: 1234567,
      asalKendaraan: 'sendiri',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    // Sepuluh hari selisih tanggal tidak boleh memengaruhi angkanya sama sekali.
    expect(row.totalPrice).toBe(1234567);
    expect(row.priceBreakdown).toBeNull();
    expect(row.source).toBe('manual');
    expect(row.status).toBe('confirmed');
  });

  it('menyimpan biaya operasional yang diisi saat pesanan dicatat', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Uji Biaya',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Innova + sopir',
      startDate: '2099-09-01',
      totalPrice: 2000000,
      asalKendaraan: 'sendiri',
      costFuel: 400000,
      costDriver: 250000,
      costTollParking: 75000,
      costOther: 25000,
      costOtherNote: 'Cuci mobil',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.costFuel).toBe(400000);
    expect(row.costDriver).toBe(250000);
    expect(row.costTollParking).toBe(75000);
    expect(row.costOther).toBe(25000);
    expect(row.costOtherNote).toBe('Cuci mobil');
  });

  it('menolak total harga kosong', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Tanpa Harga',
      phone: nomorUji(),
      serviceType: 'self-drive',
      itemName: 'Brio',
      startDate: '2099-09-01',
      totalPrice: 0,
      asalKendaraan: 'sendiri',
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.totalPrice?.[0]).toMatch(/wajib diisi/i);
  });

  it('membuat catatan pelanggan dari booking manual', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Pelanggan Baru Manual',
      phone: nomorUji(),
      serviceType: 'self-drive',
      itemName: 'Brio',
      startDate: '2099-09-01',
      totalPrice: 350000,
      asalKendaraan: 'sendiri',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.customerId).toBeTruthy();
  });

  it('menolak pesanan berpemasok tanpa nominal biaya', async () => {
    const { supplierVehicleId } = await siapkanPemasok();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Pemasok',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 700000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.supplierCost?.[0]).toMatch(/biaya/i);
  });

  it('mencatat dua angka terpisah dan memunculkan utang ke pemasok', async () => {
    const { supplierId, supplierVehicleId } = await siapkanPemasok();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Margin',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 700000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 450000,
      supplierPaid: false,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.totalPrice).toBe(700000);
    expect(row.supplierCost).toBe(450000);
    expect(row.supplierPaid).toBe(false);
    expect(row.supplierNameSnapshot).toBeTruthy();

    const utang = await getUtangPemasok();
    expect(utang.find((u) => u.supplierId === supplierId)?.total).toBe(450000);
  });

  it('menandai lunas menghapus pesanan itu dari daftar utang', async () => {
    const { supplierId, supplierVehicleId } = await siapkanPemasok();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Lunas',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 800000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 500000,
      supplierPaid: false,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    expect(await updateSupplierPaid(hasil.data.id, true)).toMatchObject({ ok: true });

    const utang = await getUtangPemasok();
    expect(utang.find((u) => u.supplierId === supplierId)).toBeUndefined();
  });

  it('tidak menyimpan data pemasok bila kendaraannya milik sendiri', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Uji Sendiri',
      phone: nomorUji(),
      serviceType: 'self-drive',
      itemName: 'Rush milik sendiri',
      startDate: '2099-09-01',
      totalPrice: 500000,
      asalKendaraan: 'sendiri',
      // Nilai-nilai ini sengaja dikirim; harus diabaikan seluruhnya.
      supplierCost: 999999,
      supplierPaid: true,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.supplierVehicleId).toBeNull();
    expect(row.supplierCost).toBeNull();
    expect(row.supplierPaid).toBe(false);
  });

  it('menautkan armada LIANS bila unitnya dipilih, tanpa menimpa keterangan', async () => {
    bersesi();
    const [armada] = await db.select().from(vehicles).limit(1);
    expect(armada).toBeTruthy();

    const hasil = await createManualBooking({
      customerName: 'Uji Armada',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Paket 3 hari harga negosiasi',
      startDate: '2099-09-01',
      totalPrice: 2000000,
      asalKendaraan: 'sendiri',
      vehicleId: armada.id,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.vehicleId).toBe(armada.id);
    // Keterangan yang diketik admin menang atas nama unit di tabel armada.
    expect(row.vehicleNameSnapshot).toBe('Paket 3 hari harga negosiasi');
  });

  it('tidak menautkan armada bila kendaraannya dari pemasok', async () => {
    const { supplierVehicleId } = await siapkanPemasok();
    bersesi();
    const [armada] = await db.select().from(vehicles).limit(1);

    const hasil = await createManualBooking({
      customerName: 'Uji Campur',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 700000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 400000,
      // Sengaja dikirim bersamaan; kendaraan tidak boleh tercatat dua asal.
      vehicleId: armada.id,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.vehicleId).toBeNull();
    expect(row.supplierVehicleId).toBe(supplierVehicleId);
  });
});

afterAll(async () => {
  for (const id of pesananDibuat) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of pelangganDibuat) await db.delete(customers).where(eq(customers.id, id));
  for (const id of pemasokDibuat) await db.delete(suppliers).where(eq(suppliers.id, id));
});
