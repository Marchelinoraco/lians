import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { users } = await import('@/db/schema');
const { createStaffUser, deleteStaffUser } = await import('@/actions/admin-settings');
const { resetStaffPassword } = await import('@/actions/admin-account');
const { getStaffUsers } = await import('@/queries/users');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const SANDI = 'kata-sandi-panjang-123';
const email = () => `hak${Date.now()}${Math.random().toString(36).slice(2, 6)}@lians.id`;

/** Sesi staf biasa — peran 'admin', bukan pemilik. */
const sebagaiStaf = (id = 'staf-uji') =>
  authMock.mockResolvedValue({ user: { id, email: 'staf@lians.id', role: 'admin' } });

const sebagaiPemilik = (id = 'pemilik-uji') =>
  authMock.mockResolvedValue({ user: { id, email: 'bos@lians.id', role: 'super_admin' } });

async function buatAkun(): Promise<string> {
  const [row] = await db
    .insert(users)
    .values({ name: 'Akun Uji Hak', email: email(), passwordHash: await bcrypt.hash(SANDI, 12) })
    .returning({ id: users.id });
  dibuat.push(row.id);
  return row.id;
}

async function hash(id: string): Promise<string> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row.passwordHash;
}

jalankan('hak akses pengelolaan akun', () => {
  it('menolak staf biasa membuat akun baru', async () => {
    sebagaiStaf();
    const hasil = await createStaffUser({ name: 'Akun Selundupan', email: email(), password: SANDI });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) dibuat.push(hasil.data.id);
  });

  it('menolak staf biasa menghapus akun orang lain', async () => {
    const korban = await buatAkun();
    sebagaiStaf();

    const hasil = await deleteStaffUser(korban);

    expect(hasil.ok).toBe(false);
    expect(await db.select().from(users).where(eq(users.id, korban))).toHaveLength(1);
  });

  // Inti celahnya: tanpa penjaga peran, pemegang akun demo dapat mereset kata
  // sandi pemilik lalu masuk sebagai dia — termasuk ke Rekap Keuangan yang
  // justru dijaga ketat di tempat lain.
  it('menolak staf biasa mereset kata sandi akun lain', async () => {
    const korban = await buatAkun();
    const sebelum = await hash(korban);
    sebagaiStaf();

    const hasil = await resetStaffPassword({ userId: korban, passwordBaru: 'sandi-rampasan-123' });

    expect(hasil.ok).toBe(false);
    expect(await hash(korban)).toBe(sebelum);
  });

  it('mengizinkan pemilik membuat akun', async () => {
    sebagaiPemilik();
    const hasil = await createStaffUser({ name: 'Staf Sah', email: email(), password: SANDI });

    expect(hasil.ok).toBe(true);
    if (hasil.ok) dibuat.push(hasil.data.id);
  });

  it('mengizinkan pemilik mereset kata sandi staf', async () => {
    const staf = await buatAkun();
    const sebelum = await hash(staf);
    sebagaiPemilik();

    const hasil = await resetStaffPassword({ userId: staf, passwordBaru: 'sandi-baru-sah-123' });

    expect(hasil.ok).toBe(true);
    expect(await hash(staf)).not.toBe(sebelum);
  });

  it('mengizinkan pemilik menghapus akun staf', async () => {
    const staf = await buatAkun();
    sebagaiPemilik();

    expect((await deleteStaffUser(staf)).ok).toBe(true);
    expect(await db.select().from(users).where(eq(users.id, staf))).toHaveLength(0);
  });
});

jalankan('daftar akun', () => {
  // Penjaganya di dalam kueri, bukan hanya di halaman pemanggilnya — pola yang
  // sama dengan angka rekap. Selama daftar akun hanya dapat lahir dari sini,
  // tidak ada halaman atau Server Action baru yang membocorkannya karena
  // penulisnya lupa memasang penjaga.
  it('menolak dibaca oleh staf biasa, bukan hanya disembunyikan dari layar', async () => {
    sebagaiStaf();
    await expect(getStaffUsers()).rejects.toThrow(/sesi tidak valid/i);
  });

  it('dapat dibaca pemilik', async () => {
    sebagaiPemilik();
    const daftar = await getStaffUsers();
    expect(daftar.length).toBeGreaterThan(0);
    // Hash kata sandi tidak pernah ikut keluar dari database.
    expect(daftar[0]).not.toHaveProperty('passwordHash');
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(users).where(eq(users.id, id));
});
