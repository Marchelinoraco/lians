import { desc, eq, and } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';

/** Hanya artikel terbit, terbaru dulu. Dipakai halaman publik. */
export async function getPublishedPosts() {
  return db
    .select()
    .from(posts)
    .where(eq(posts.isPublished, true))
    .orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

/**
 * Artikel terbit berdasarkan slug.
 *
 * Penyaring isPublished ikut di sini, bukan hanya di halaman: tanpa itu, siapa
 * pun yang menebak slug dapat membaca draf yang belum siap.
 */
export async function getPublishedPostBySlug(slug: string) {
  const [row] = await db
    .select()
    .from(posts)
    .where(and(eq(posts.slug, slug), eq(posts.isPublished, true)))
    .limit(1);
  return row ?? null;
}

export async function getAllPosts() {
  return db.select().from(posts).orderBy(desc(posts.publishedAt), desc(posts.createdAt));
}

export async function getPostById(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return row ?? null;
}
