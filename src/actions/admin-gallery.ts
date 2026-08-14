'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { galleryItems } from '@/db/schema';
import { galleryInputSchema } from '@/schemas/gallery';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

/** Galeri tampil di halaman Testimoni, jadi halaman itu yang dibuat ulang. */
function segarkan() {
  revalidatePath('/galeri');
  revalidatePath('/[locale]/testimoni', 'page');
}

export async function createGalleryItem(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = galleryInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .insert(galleryItems)
    .values({
      image: parsed.data.image,
      caption: parsed.data.caption,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
    })
    .returning({ id: galleryItems.id });

  segarkan();
  return ok({ id: row.id });
}

export async function updateGalleryItem(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = galleryInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .update(galleryItems)
    .set({
      image: parsed.data.image,
      caption: parsed.data.caption,
      isPublished: parsed.data.isPublished,
      sortOrder: parsed.data.sortOrder,
    })
    .where(eq(galleryItems.id, id))
    .returning({ id: galleryItems.id });

  if (!row) return fail('Foto tidak ditemukan.');

  segarkan();
  return ok({ id: row.id });
}

export async function deleteGalleryItem(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(galleryItems).where(eq(galleryItems.id, id)).returning({
    id: galleryItems.id,
  });
  if (!row) return fail('Foto tidak ditemukan.');

  segarkan();
  return ok({ id: row.id });
}
