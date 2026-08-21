'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

const statusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);

/** Riwayat dibaca manusia, jadi statusnya ditulis seperti yang tampil di layar. */
const LABEL_STATUS: Record<string, string> = {
  pending: 'menunggu',
  confirmed: 'dikonfirmasi',
  cancelled: 'dibatalkan',
  completed: 'selesai',
};

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
    .returning({ id: bookings.id, bookingCode: bookings.bookingCode });

  if (!row) return fail('Pesanan tidak ditemukan.');

  await catatAktivitas({
    aksi: 'pesanan.status',
    ringkasan: `Mengubah status pesanan ${row.bookingCode} menjadi ${LABEL_STATUS[parsed.data]}`,
    entitas: 'booking',
    entitasId: id,
  });

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
    .returning({ id: bookings.id, bookingCode: bookings.bookingCode });

  if (!row) return fail('Pesanan tidak ditemukan.');

  await catatAktivitas({
    aksi: 'pesanan.catatan',
    ringkasan: `Mengubah catatan internal pesanan ${row.bookingCode}`,
    entitas: 'booking',
    entitasId: id,
  });

  revalidatePath(`/booking/${id}`);
  return ok({ id: row.id });
}

export async function deleteBooking(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(bookings).where(eq(bookings.id, id)).returning({
    id: bookings.id,
    bookingCode: bookings.bookingCode,
    customerName: bookings.customerName,
  });
  if (!row) return fail('Pesanan tidak ditemukan.');

  // Kode dan nama disalin ke ringkasan, bukan sekadar id: setelah pesanannya
  // hilang, baris riwayat inilah satu-satunya keterangan bahwa ia pernah ada.
  await catatAktivitas({
    aksi: 'pesanan.hapus',
    ringkasan: `Menghapus pesanan ${row.bookingCode} atas nama ${row.customerName}`,
    entitas: 'booking',
    entitasId: id,
  });

  revalidatePath('/');
  revalidatePath('/booking');
  return ok({ id: row.id });
}
