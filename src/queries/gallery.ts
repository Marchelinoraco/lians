import { asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { galleryItems } from '@/db/schema';

export async function getPublishedGallery() {
  return db
    .select()
    .from(galleryItems)
    .where(eq(galleryItems.isPublished, true))
    .orderBy(asc(galleryItems.sortOrder), desc(galleryItems.createdAt));
}

export async function getAllGallery() {
  return db
    .select()
    .from(galleryItems)
    .orderBy(asc(galleryItems.sortOrder), desc(galleryItems.createdAt));
}
