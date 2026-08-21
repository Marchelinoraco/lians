'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { vehicleInputSchema } from '@/schemas/vehicle';
import { slugUnik } from '@/lib/slug';
import { getAllVehicles } from '@/queries/vehicles';
import { LOCALES, localeHref } from '@/i18n';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

function segarkan(slug?: string) {
  for (const locale of LOCALES) {
    revalidatePath(localeHref('/', locale));
    revalidatePath(localeHref('/mobil', locale));
    revalidatePath(localeHref('/booking', locale));
    if (slug) revalidatePath(localeHref(`/mobil/${slug}`, locale));
  }
  revalidatePath('/sitemap.xml');
}

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createVehicle(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = vehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const terpakai = (await getAllVehicles()).map((v) => v.slug);
  const slug = slugUnik(parsed.data.slug || parsed.data.name, terpakai);

  const [row] = await db
    .insert(vehicles)
    .values({ ...parsed.data, slug, driverFeeOverride: null })
    .returning({ id: vehicles.id });

  segarkan(slug);
  await catatAktivitas({
    aksi: 'armada.buat',
    ringkasan: `Menambah kendaraan ${parsed.data.name}`,
  });

  return ok({ id: row.id });
}

export async function updateVehicle(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = vehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const semua = await getAllVehicles();
  const lama = semua.find((v) => v.id === id);
  if (!lama) return fail('Kendaraan tidak ditemukan.');

  const diminta = parsed.data.slug || parsed.data.name;
  const slug =
    lama.slug === diminta
      ? lama.slug
      : slugUnik(
          diminta,
          semua.filter((v) => v.id !== id).map((v) => v.slug),
        );

  await db
    .update(vehicles)
    .set({ ...parsed.data, slug, updatedAt: new Date() })
    .where(eq(vehicles.id, id));

  segarkan(slug);
  if (lama.slug !== slug) segarkan(lama.slug);
  await catatAktivitas({
    aksi: 'armada.ubah',
    ringkasan: `Mengubah kendaraan ${parsed.data.name}`,
  });

  return ok({ id });
}

export async function deleteVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [lama] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  if (!lama) return fail('Kendaraan tidak ditemukan.');

  // Pesanan lama menyimpan nama kendaraan sebagai salinan beku, jadi menghapus
  // kendaraan tidak merusak riwayat pesanan.
  await db.delete(vehicles).where(eq(vehicles.id, id));

  segarkan(lama.slug);
  await catatAktivitas({
    aksi: 'armada.hapus',
    ringkasan: `Menghapus kendaraan ${lama.name}`,
  });

  return ok({ id });
}
