import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { users } = await import('@/db/schema');
const { changeOwnPassword, resetStaffPassword } = await import('@/actions/admin-account');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const LAMA = 'kata-sandi-lama-123';
const BARU = 'kata-sandi-baru-456';

async function buatAkun(): Promise<string> {
  const [row] = await db
    .insert(users)
    .values({
      name: 'Staf Uji Sandi',
      email: `sandi${Date.now()}${Math.random().toString(36).slice(2, 6)}@lians.id`,
      passwordHash: await bcrypt.hash(LAMA, 12),
    })
    .returning({ id: users.id });
  dibuat.push(row.id);
  return row.id;
}

async function hash(id: string): Promise<string> {
  const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return row.passwordHash;
}

const bersesi = (id: string) => authMock.mockResolvedValue({ user: { id, email: 'u@lians.id' } });

jalankan('changeOwnPassword', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const hasil = await changeOwnPassword({ passwordLama: LAMA, passwordBaru: BARU });
    expect(hasil.ok).toBe(false);
  });

  it('mengganti kata sandi bila kata sandi lama benar', async () => {
    const id = await buatAkun();
    bersesi(id);

    expect(await changeOwnPassword({ passwordLama: LAMA, passwordBaru: BARU })).toMatchObject({
      ok: true,
    });

    const h = await hash(id);
    expect(await bcrypt.compare(BARU, h)).toBe(true);
    expect(await bcrypt.compare(LAMA, h)).toBe(false);
  });

  it('menolak bila kata sandi lama salah, dan tidak mengubah apa pun', async () => {
    const id = await buatAkun();
    bersesi(id);
    const sebelum = await hash(id);

    const hasil = await changeOwnPassword({ passwordLama: 'tebakan-salah', passwordBaru: BARU });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.message).toMatch(/salah/i);

    expect(await hash(id)).toBe(sebelum);
  });

  it('menolak kata sandi baru yang terlalu pendek', async () => {
    const id = await buatAkun();
    bersesi(id);
    const sebelum = await hash(id);

    expect(await changeOwnPassword({ passwordLama: LAMA, passwordBaru: 'pendek' })).toMatchObject({
      ok: false,
    });
    expect(await hash(id)).toBe(sebelum);
  });

  it('menolak kata sandi baru yang sama dengan yang sekarang', async () => {
    const id = await buatAkun();
    bersesi(id);

    const hasil = await changeOwnPassword({ passwordLama: LAMA, passwordBaru: LAMA });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.message).toMatch(/berbeda/i);
  });

  it('tidak pernah menyimpan kata sandi apa adanya', async () => {
    const id = await buatAkun();
    bersesi(id);
    await changeOwnPassword({ passwordLama: LAMA, passwordBaru: BARU });

    const h = await hash(id);
    expect(h).not.toContain(BARU);
    expect(h.startsWith('$2')).toBe(true);
  });
});

jalankan('resetStaffPassword', () => {
  it('menolak tanpa sesi', async () => {
    const id = await buatAkun();
    authMock.mockResolvedValue(null);

    const sebelum = await hash(id);
    expect(await resetStaffPassword({ userId: id, passwordBaru: BARU })).toMatchObject({
      ok: false,
    });
    expect(await hash(id)).toBe(sebelum);
  });

  it('menyetel ulang kata sandi staf lain tanpa perlu kata sandi lamanya', async () => {
    const staf = await buatAkun();
    const admin = await buatAkun();
    bersesi(admin);

    expect(await resetStaffPassword({ userId: staf, passwordBaru: BARU })).toMatchObject({
      ok: true,
    });
    expect(await bcrypt.compare(BARU, await hash(staf))).toBe(true);
  });

  it('menolak akun yang tidak ada', async () => {
    const admin = await buatAkun();
    bersesi(admin);

    expect(
      await resetStaffPassword({
        userId: '00000000-0000-4000-8000-000000000000',
        passwordBaru: BARU,
      }),
    ).toMatchObject({ ok: false });
  });

  it('menolak kata sandi baru yang terlalu pendek', async () => {
    const staf = await buatAkun();
    const admin = await buatAkun();
    bersesi(admin);
    const sebelum = await hash(staf);

    expect(await resetStaffPassword({ userId: staf, passwordBaru: 'pendek' })).toMatchObject({
      ok: false,
    });
    expect(await hash(staf)).toBe(sebelum);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(users).where(eq(users.id, id));
});
