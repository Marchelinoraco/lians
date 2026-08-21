'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { tourRequests } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

const statusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function updateTourRequestStatus(
  id: string,
  status: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail('Status tidak dikenal.');

  const [row] = await db
    .update(tourRequests)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(tourRequests.id, id))
    .returning({ id: tourRequests.id, requestCode: tourRequests.requestCode });

  if (!row) return fail('Permintaan tidak ditemukan.');

  revalidatePath('/permintaan-tur');
  revalidatePath(`/permintaan-tur/${id}`);
  await catatAktivitas({
    aksi: 'tur.status',
    ringkasan: `Mengubah status permintaan tur ${row.requestCode}`,
  });

  return ok({ id: row.id });
}

export async function updateTourRequestNotes(
  id: string,
  catatan: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = z.string().max(2000).safeParse(catatan);
  if (!parsed.success) return fail('Catatan terlalu panjang.');

  const [row] = await db
    .update(tourRequests)
    .set({ adminNotes: parsed.data || null, updatedAt: new Date() })
    .where(eq(tourRequests.id, id))
    .returning({ id: tourRequests.id, requestCode: tourRequests.requestCode });

  if (!row) return fail('Permintaan tidak ditemukan.');

  revalidatePath(`/permintaan-tur/${id}`);
  await catatAktivitas({
    aksi: 'tur.catatan',
    ringkasan: `Mengubah catatan permintaan tur ${row.requestCode}`,
  });

  return ok({ id: row.id });
}

export async function deleteTourRequest(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(tourRequests).where(eq(tourRequests.id, id)).returning({
    id: tourRequests.id,
    requestCode: tourRequests.requestCode,
  });
  if (!row) return fail('Permintaan tidak ditemukan.');

  revalidatePath('/permintaan-tur');
  await catatAktivitas({
    aksi: 'tur.hapus',
    ringkasan: `Menghapus permintaan tur ${row.requestCode}`,
  });

  return ok({ id: row.id });
}
