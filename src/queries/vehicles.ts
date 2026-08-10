import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles } from '@/db/schema';

export async function getPublishedVehicles() {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isPublished, true))
    .orderBy(asc(vehicles.sortOrder), asc(vehicles.name));
}

export async function getVehicleBySlug(slug: string) {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.slug, slug)).limit(1);
  return row ?? null;
}

export async function getVehicleById(id: string) {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return row ?? null;
}

export async function getFeaturedVehicles(limit = 6) {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isPublished, true))
    .orderBy(asc(vehicles.sortOrder))
    .limit(limit);
}

export async function getAllVehicles() {
  return db.select().from(vehicles).orderBy(asc(vehicles.sortOrder), asc(vehicles.name));
}
