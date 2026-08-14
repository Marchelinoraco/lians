import { desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { ticketRequests } from '@/db/schema';
import { berbentukUuid } from '@/lib/uuid';

type Status = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export async function getTicketRequests(status?: Status) {
  if (!status) return db.select().from(ticketRequests).orderBy(desc(ticketRequests.createdAt));

  return db
    .select()
    .from(ticketRequests)
    .where(eq(ticketRequests.status, status))
    .orderBy(desc(ticketRequests.createdAt));
}

export async function getTicketRequestById(id: string) {
  if (!berbentukUuid(id)) return null;
  const [row] = await db.select().from(ticketRequests).where(eq(ticketRequests.id, id)).limit(1);
  return row ?? null;
}
