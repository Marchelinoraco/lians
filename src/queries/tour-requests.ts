import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { tourRequests } from '@/db/schema';
import { berbentukUuid } from '@/lib/uuid';

type Status = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export async function getTourRequests(status?: Status) {
  if (!status) return db.select().from(tourRequests).orderBy(desc(tourRequests.createdAt));

  return db
    .select()
    .from(tourRequests)
    .where(eq(tourRequests.status, status))
    .orderBy(desc(tourRequests.createdAt));
}

export async function getTourRequestById(id: string) {
  if (!berbentukUuid(id)) return null;
  const [row] = await db.select().from(tourRequests).where(eq(tourRequests.id, id)).limit(1);
  return row ?? null;
}

export async function getPendingTourRequestCount(): Promise<number> {
  const rows = await db
    .select({ id: tourRequests.id })
    .from(tourRequests)
    .where(eq(tourRequests.status, 'pending'));
  return rows.length;
}
