'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

const statusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function updateBookingStatus(
  id: string,
  status: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail('Status tidak dikenal.');

  const [row] = await db
    .update(bookings)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id });

  if (!row) return fail('Pesanan tidak ditemukan.');

  revalidatePath('/');
  revalidatePath('/booking');
  revalidatePath(`/booking/${id}`);
  return ok({ id: row.id });
}

export async function updateAdminNotes(
  id: string,
  catatan: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = z.string().max(2000).safeParse(catatan);
  if (!parsed.success) return fail('Catatan terlalu panjang (maksimum 2000 karakter).');

  const [row] = await db
    .update(bookings)
    .set({ adminNotes: parsed.data || null, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id });

  if (!row) return fail('Pesanan tidak ditemukan.');

  revalidatePath(`/booking/${id}`);
  return ok({ id: row.id });
}

export async function deleteBooking(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(bookings).where(eq(bookings.id, id)).returning({
    id: bookings.id,
  });
  if (!row) return fail('Pesanan tidak ditemukan.');

  revalidatePath('/');
  revalidatePath('/booking');
  return ok({ id: row.id });
}
