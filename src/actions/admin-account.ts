'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

const passwordBaru = z
  .string()
  .min(10, 'Kata sandi baru minimal 10 karakter')
  .max(200, 'Kata sandi terlalu panjang');

const gantiSchema = z.object({
  passwordLama: z.string().min(1, 'Kata sandi saat ini wajib diisi'),
  passwordBaru,
});

/**
 * Mengganti kata sandi akun yang sedang login.
 *
 * Kata sandi lama tetap diminta walaupun sesinya sudah sah: tanpa itu, siapa
 * pun yang menemukan peramban dalam keadaan masih login bisa mengunci pemilik
 * aslinya keluar dari akunnya sendiri.
 */
export async function changeOwnPassword(input: unknown): Promise<ActionResult<{ ok: true }>> {
  let sesi;
  try {
    sesi = await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = gantiSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, sesi.id)).limit(1);
  if (!user) return fail('Akun tidak ditemukan.');

  const cocok = await bcrypt.compare(parsed.data.passwordLama, user.passwordHash);
  if (!cocok) return fail('Kata sandi saat ini salah.');

  if (parsed.data.passwordLama === parsed.data.passwordBaru) {
    return fail('Kata sandi baru harus berbeda dari yang sekarang.');
  }

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.passwordBaru, 12) })
    .where(eq(users.id, sesi.id));

  return ok({ ok: true });
}

const resetSchema = z.object({
  userId: z.string().uuid('Akun tidak dikenal'),
  passwordBaru,
});

/**
 * Menyetel ulang kata sandi staf lain.
 *
 * Diperlukan karena sistem ini tidak mengirim email: tanpa jalur ini, staf yang
 * lupa kata sandinya terkunci selamanya. Kata sandi lama tidak diminta — orang
 * yang mereset memang tidak mengetahuinya.
 *
 * Semua staf punya hak yang sama, jadi siapa pun yang sudah login dapat
 * melakukan ini. Itu konsekuensi sadar dari tidak adanya tingkatan peran.
 */
export async function resetStaffPassword(input: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = resetSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [user] = await db.select().from(users).where(eq(users.id, parsed.data.userId)).limit(1);
  if (!user) return fail('Akun tidak ditemukan.');

  await db
    .update(users)
    .set({ passwordHash: await bcrypt.hash(parsed.data.passwordBaru, 12) })
    .where(eq(users.id, parsed.data.userId));

  revalidatePath('/pengaturan');
  return ok({ ok: true });
}
