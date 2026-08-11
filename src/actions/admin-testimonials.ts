'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { testimonials } from '@/db/schema';
import { testimonialInputSchema } from '@/schemas/testimonial';
import { LOCALES, localeHref } from '@/i18n';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

function segarkan() {
  for (const locale of LOCALES) {
    revalidatePath(localeHref('/', locale));
    revalidatePath(localeHref('/testimoni', locale));
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

export async function createTestimonial(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = testimonialInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db.insert(testimonials).values(parsed.data).returning({
    id: testimonials.id,
  });

  segarkan();
  return ok({ id: row.id });
}

export async function updateTestimonial(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = testimonialInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .update(testimonials)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(testimonials.id, id))
    .returning({ id: testimonials.id });

  if (!row) return fail('Testimoni tidak ditemukan.');

  segarkan();
  return ok({ id: row.id });
}

export async function deleteTestimonial(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(testimonials).where(eq(testimonials.id, id)).returning({
    id: testimonials.id,
  });
  if (!row) return fail('Testimoni tidak ditemukan.');

  segarkan();
  return ok({ id: row.id });
}
