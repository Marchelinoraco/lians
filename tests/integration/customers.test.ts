import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { customers } = await import('@/db/schema');
const { createCustomer, updateCustomer, deleteCustomer } = await import(
  '@/actions/admin-customers'
);
const { cocokkanAtauBuatPelanggan } = await import('@/lib/customer-match');
const { getCustomers } = await import('@/queries/customers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

jalankan('master data pelanggan', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    expect(await createCustomer({ name: 'Tak Boleh', phone: nomorUji() })).toMatchObject({
      ok: false,
    });
  });

  it('mengenali nomor yang sama walau ditulis berbeda', async () => {
    const lokal = nomorUji();
    const internasional = `+62${lokal.slice(1)}`;

    const pertama = await cocokkanAtauBuatPelanggan({ name: 'Budi', phone: lokal });
    dibuat.push(pertama);

    const kedua = await cocokkanAtauBuatPelanggan({ name: 'Budi Santoso', phone: internasional });
    expect(kedua).toBe(pertama);

    const [row] = await db.select().from(customers).where(eq(customers.id, pertama));
    expect(row.phone.startsWith('62')).toBe(true);
    expect(row.name).toBe('Budi Santoso');
  });

  it('menolak nomor yang sudah terdaftar', async () => {
    bersesi();
    const nomor = nomorUji();
    const a = await createCustomer({ name: 'Sari', phone: nomor });
    expect(a.ok).toBe(true);
    if (a.ok) dibuat.push(a.data.id);

    const b = await createCustomer({ name: 'Sari Lain', phone: nomor });
    expect(b.ok).toBe(false);
    if (b.ok) return;
    expect(b.message).toMatch(/sudah terdaftar/i);
  });

  it('menolak nomor telepon yang bukan format Indonesia', async () => {
    bersesi();
    expect(await createCustomer({ name: 'Uji', phone: '12345' })).toMatchObject({ ok: false });
  });

  it('mencari pelanggan berdasarkan nama', async () => {
    bersesi();
    const nama = `Cari Saya ${Date.now()}`;
    const hasil = await createCustomer({ name: nama, phone: nomorUji() });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    dibuat.push(hasil.data.id);

    const ketemu = await getCustomers('Cari Saya');
    expect(ketemu.some((c) => c.id === hasil.data.id)).toBe(true);
  });

  it('mengubah dan menghapus pelanggan', async () => {
    bersesi();
    const hasil = await createCustomer({ name: 'Akan Diubah', phone: nomorUji() });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(
      await updateCustomer(hasil.data.id, { name: 'Sudah Diubah', phone: nomorUji() }),
    ).toMatchObject({ ok: true });

    const [row] = await db.select().from(customers).where(eq(customers.id, hasil.data.id));
    expect(row.name).toBe('Sudah Diubah');

    expect(await deleteCustomer(hasil.data.id)).toMatchObject({ ok: true });
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(customers).where(eq(customers.id, id));
});
