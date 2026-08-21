'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { travelRoutes } from '@/db/schema';
import { routeInputSchema } from '@/schemas/route';
import { LOCALES, localeHref } from '@/i18n';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

function segarkan() {
  for (const locale of LOCALES) {
    revalidatePath(localeHref('/', locale));
    revalidatePath(localeHref('/travel', locale));
    revalidatePath(localeHref('/booking', locale));
  }
}

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createRoute(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = routeInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db.insert(travelRoutes).values(parsed.data).returning({
    id: travelRoutes.id,
    destination: travelRoutes.destination,
  });

  segarkan();
  await catatAktivitas({
    aksi: 'rute.buat',
    ringkasan: `Menambah rute ${parsed.data.origin} – ${parsed.data.destination}`,
  });

  return ok({ id: row.id });
}

export async function updateRoute(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = routeInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .update(travelRoutes)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(travelRoutes.id, id))
    .returning({ id: travelRoutes.id });

  if (!row) return fail('Rute tidak ditemukan.');

  segarkan();
  await catatAktivitas({
    aksi: 'rute.ubah',
    ringkasan: `Mengubah rute ${parsed.data.origin} – ${parsed.data.destination}`,
  });

  return ok({ id: row.id });
}

export async function deleteRoute(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(travelRoutes).where(eq(travelRoutes.id, id)).returning({
    id: travelRoutes.id,
    destination: travelRoutes.destination,
  });
  if (!row) return fail('Rute tidak ditemukan.');

  segarkan();
  await catatAktivitas({
    aksi: 'rute.hapus',
    ringkasan: `Menghapus rute menuju ${row.destination}`,
  });

  return ok({ id: row.id });
}
