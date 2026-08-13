'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { ticketRequests } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

const statusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled']);

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function updateTicketRequestStatus(
  id: string,
  status: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail('Status tidak dikenal.');

  const [row] = await db
    .update(ticketRequests)
    .set({ status: parsed.data, updatedAt: new Date() })
    .where(eq(ticketRequests.id, id))
    .returning({ id: ticketRequests.id });

  if (!row) return fail('Permintaan tidak ditemukan.');

  revalidatePath('/permintaan-tiket');
  revalidatePath(`/permintaan-tiket/${id}`);
  return ok({ id: row.id });
}

export async function updateTicketRequestNotes(
  id: string,
  catatan: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = z.string().max(2000).safeParse(catatan);
  if (!parsed.success) return fail('Catatan terlalu panjang.');

  const [row] = await db
    .update(ticketRequests)
    .set({ adminNotes: parsed.data || null, updatedAt: new Date() })
    .where(eq(ticketRequests.id, id))
    .returning({ id: ticketRequests.id });

  if (!row) return fail('Permintaan tidak ditemukan.');

  revalidatePath(`/permintaan-tiket/${id}`);
  return ok({ id: row.id });
}

export async function deleteTicketRequest(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(ticketRequests).where(eq(ticketRequests.id, id)).returning({
    id: ticketRequests.id,
  });
  if (!row) return fail('Permintaan tidak ditemukan.');

  revalidatePath('/permintaan-tiket');
  return ok({ id: row.id });
}
