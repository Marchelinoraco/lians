import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { travelRoutes } from '@/db/schema';
import { berbentukUuid } from '@/lib/uuid';

export async function getPublishedRoutes() {
  return db
    .select()
    .from(travelRoutes)
    .where(eq(travelRoutes.isPublished, true))
    .orderBy(asc(travelRoutes.sortOrder), asc(travelRoutes.destination));
}

export async function getAllRoutes() {
  return db.select().from(travelRoutes).orderBy(asc(travelRoutes.sortOrder));
}

export async function getRouteById(id: string) {
  if (!berbentukUuid(id)) return null;
  const [row] = await db.select().from(travelRoutes).where(eq(travelRoutes.id, id)).limit(1);
  return row ?? null;
}
