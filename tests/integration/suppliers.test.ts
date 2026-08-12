import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { suppliers, supplierVehicles, bookings } = await import('@/db/schema');
const { createSupplier, updateSupplier, deleteSupplier, addSupplierVehicle } = await import(
  '@/actions/admin-suppliers'
);
const { getUtangPemasok, getAllSupplierVehicles } = await import('@/queries/suppliers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const pemasokDibuat: string[] = [];
const pesananDibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const kode = () => `LNS-UTANG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

jalankan('pemasok', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    expect(await createSupplier({ name: 'Tak Boleh' })).toMatchObject({ ok: false });
  });

  it('membuat pemasok beserta kendaraannya', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Uji ${Date.now()}`, phone: '081234567890' });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Avanza Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    const semua = await getAllSupplierVehicles();
    expect(semua.some((v) => v.id === k.data.id)).toBe(true);
  });

  it('menyembunyikan kendaraan dari pemasok yang dinonaktifkan', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Nonaktif ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Xenia Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    await updateSupplier(p.data.id, { name: 'Pemasok Nonaktif', isActive: false });

    const semua = await getAllSupplierVehicles();
    expect(semua.some((v) => v.id === k.data.id)).toBe(false);
  });

  it('menghitung utang per pemasok dari pesanan yang belum lunas', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Utang ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Innova Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    for (const [biaya, lunas] of [
      [500000, false],
      [300000, false],
      [900000, true],
    ] as const) {
      const [row] = await db
        .insert(bookings)
        .values({
          bookingCode: kode(),
          customerName: 'Uji Utang',
          phone: '081234567890',
          serviceType: 'with-driver',
          startDate: '2099-09-01',
          supplierVehicleId: k.data.id,
          supplierNameSnapshot: 'Pemasok Utang',
          supplierCost: biaya,
          supplierPaid: lunas,
          totalPrice: biaya + 200000,
          status: 'confirmed',
        })
        .returning({ id: bookings.id });
      pesananDibuat.push(row.id);
    }

    const utang = await getUtangPemasok();
    const milikKita = utang.find((u) => u.supplierId === p.data.id);

    expect(milikKita).toBeTruthy();
    // Hanya dua pesanan belum lunas yang dihitung; yang sudah lunas diabaikan.
    expect(milikKita?.total).toBe(800000);
    expect(milikKita?.pesanan).toHaveLength(2);
  });

  it('tidak menghitung pesanan yang dibatalkan sebagai utang', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Batal ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Rush Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: kode(),
        customerName: 'Uji Batal',
        phone: '081234567890',
        serviceType: 'with-driver',
        startDate: '2099-09-01',
        supplierVehicleId: k.data.id,
        supplierCost: 400000,
        supplierPaid: false,
        totalPrice: 600000,
        status: 'cancelled',
      })
      .returning({ id: bookings.id });
    pesananDibuat.push(row.id);

    const utang = await getUtangPemasok();
    expect(utang.find((u) => u.supplierId === p.data.id)).toBeUndefined();
  });

  it('menghapus pemasok ikut menghapus daftar kendaraannya', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Dihapus ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Brio Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    expect(await deleteSupplier(p.data.id)).toMatchObject({ ok: true });

    const [sisa] = await db
      .select()
      .from(supplierVehicles)
      .where(eq(supplierVehicles.id, k.data.id));
    expect(sisa).toBeUndefined();
  });
});

afterAll(async () => {
  for (const id of pesananDibuat) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of pemasokDibuat) await db.delete(suppliers).where(eq(suppliers.id, id));
});
