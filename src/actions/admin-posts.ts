'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { posts } from '@/db/schema';
import { postInputSchema } from '@/schemas/post';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

/** Halaman publik dibuat ulang agar artikel baru langsung tampil. */
function segarkan(slug?: string) {
  revalidatePath('/blog');
  revalidatePath('/[locale]/blog', 'page');
  if (slug) revalidatePath(`/[locale]/blog/${slug}`, 'page');
}

export async function createPost(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [ada] = await db.select().from(posts).where(eq(posts.slug, parsed.data.slug)).limit(1);
  if (ada) return fail('Slug ini sudah dipakai artikel lain.');

  const [row] = await db
    .insert(posts)
    .values({
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      body: parsed.data.body,
      coverImage: parsed.data.coverImage,
      publishedAt: parsed.data.publishedAt,
      isPublished: parsed.data.isPublished,
    })
    .returning({ id: posts.id });

  segarkan(parsed.data.slug);
  revalidatePath('/blog');
  await catatAktivitas({
    aksi: 'blog.buat',
    ringkasan: `Menerbitkan artikel ${parsed.data.title.id}`,
  });

  return ok({ id: row.id });
}

export async function updatePost(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = postInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [bentrok] = await db.select().from(posts).where(eq(posts.slug, parsed.data.slug)).limit(1);
  if (bentrok && bentrok.id !== id) return fail('Slug ini sudah dipakai artikel lain.');

  const [row] = await db
    .update(posts)
    .set({
      slug: parsed.data.slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      body: parsed.data.body,
      coverImage: parsed.data.coverImage,
      publishedAt: parsed.data.publishedAt,
      isPublished: parsed.data.isPublished,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, id))
    .returning({ id: posts.id, slug: posts.slug });

  if (!row) return fail('Artikel tidak ditemukan.');

  segarkan(row.slug);
  revalidatePath(`/blog/${id}`);
  await catatAktivitas({
    aksi: 'blog.ubah',
    ringkasan: `Mengubah artikel ${parsed.data.title.id}`,
  });

  return ok({ id: row.id });
}

export async function deletePost(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(posts).where(eq(posts.id, id)).returning({
    id: posts.id,
    slug: posts.slug,
  });
  if (!row) return fail('Artikel tidak ditemukan.');

  segarkan(row.slug);
  await catatAktivitas({
    aksi: 'blog.hapus',
    ringkasan: `Menghapus artikel ${row.slug}`,
  });

  return ok({ id: row.id });
}
