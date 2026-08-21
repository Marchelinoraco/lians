'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { siteSettings, users } from '@/db/schema';
import { settingsInputSchema } from '@/schemas/settings';
import { LOCALES, localeHref } from '@/i18n';
import { requireSession, requireSuperAdmin } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function updateSettings(input: unknown): Promise<ActionResult<{ ok: true }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  // Disimpan sebagai baris kunci-nilai agar menambah pengaturan baru kelak
  // tidak memerlukan migrasi tabel.
  for (const [key, value] of Object.entries(parsed.data)) {
    await db
      .insert(siteSettings)
      .values({ key, value: value as never, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: value as never, updatedAt: new Date() },
      });
  }

  // Pengaturan menyentuh header, footer, dan hero di setiap halaman.
  for (const locale of LOCALES) {
    for (const path of ['/', '/mobil', '/travel', '/booking', '/testimoni', '/tentang', '/kontak'])
      revalidatePath(localeHref(path, locale));
  }

  await catatAktivitas({ aksi: 'pengaturan.ubah', ringkasan: 'Mengubah pengaturan situs' });

  return ok({ ok: true });
}

/**
 * Penjaga khusus pengelolaan akun.
 *
 * Membuat, menghapus, dan mereset kata sandi hanya milik pemilik. Tanpa ini,
 * pemegang akun staf mana pun dapat mereset kata sandi super admin lalu masuk
 * sebagai dia — dan sampai ke Rekap Keuangan yang justru dijaga ketat di
 * tempat lain. Penjaga peran di sana tidak ada gunanya bila peran itu sendiri
 * dapat diambil alih dari halaman Pengaturan.
 */
async function jagaPemilik(): Promise<string | null> {
  try {
    await requireSuperAdmin();
    return null;
  } catch {
    return 'Hanya pemilik yang dapat mengelola akun.';
  }
}

const staffSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(10, 'Kata sandi minimal 10 karakter').max(200),
});

export async function createStaffUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jagaPemilik();
  if (galat) return fail(galat);

  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [ada] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (ada) return fail('Email itu sudah dipakai akun lain.');

  const [row] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    })
    .returning({ id: users.id });

  await catatAktivitas({
    aksi: 'akun.buat',
    ringkasan: `Membuat akun staf ${parsed.data.email}`,
    entitas: 'user',
    entitasId: row.id,
  });

  revalidatePath('/pengaturan');
  return ok({ id: row.id });
}

export async function deleteStaffUser(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jagaPemilik();
  if (galat) return fail(galat);

  const sesi = await requireSession();
  if (sesi.id === id) return fail('Anda tidak bisa menghapus akun yang sedang dipakai.');

  const jumlah = await db.select({ id: users.id }).from(users);
  if (jumlah.length <= 1) return fail('Harus tersisa minimal satu akun staf.');

  const [row] = await db
    .delete(users)
    .where(eq(users.id, id))
    .returning({ id: users.id, email: users.email });
  if (!row) return fail('Akun tidak ditemukan.');

  await catatAktivitas({
    aksi: 'akun.hapus',
    ringkasan: `Menghapus akun staf ${row.email}`,
    entitas: 'user',
    entitasId: id,
  });

  revalidatePath('/pengaturan');
  return ok({ id: row.id });
}
