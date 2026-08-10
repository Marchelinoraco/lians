import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { testimonials } from '@/db/schema';

export async function getPublishedTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.date));
}

export async function getFeaturedTestimonials(limit = 5) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.isPublished, true), eq(testimonials.isFeatured, true)))
    .orderBy(asc(testimonials.sortOrder))
    .limit(limit);
}

export async function getAllTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
}
