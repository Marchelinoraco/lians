import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { berbentukUuid } from '@/lib/uuid';

type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export async function getBookings(status?: Status) {
  // Drizzle tidak mengizinkan .where() setelah .orderBy(), jadi cabangnya di sini.
  return status
    ? db
        .select()
        .from(bookings)
        .where(eq(bookings.status, status))
        .orderBy(desc(bookings.createdAt))
    : db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingById(id: string) {
  if (!berbentukUuid(id)) return null;
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return row ?? null;
}

export async function getPendingCount() {
  const [row] = await db
    .select({ jumlah: count() })
    .from(bookings)
    .where(eq(bookings.status, 'pending'));
  return row?.jumlah ?? 0;
}
