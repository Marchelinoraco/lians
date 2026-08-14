import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostById } from '@/queries/posts';
import { PostForm } from '@/components/admin/PostForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updatePost, deletePost } from '@/actions/admin-posts';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function ArtikelEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const artikel = await getPostById(id);
  if (!artikel) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updatePost(id, input);
  }

  async function hapus() {
    'use server';
    return deletePost(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/blog" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{artikel.title.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          {artikel.isPublished ? (
            <a
              href={`/blog/${artikel.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400"
            >
              Lihat di situs ↗
            </a>
          ) : null}
          <DeleteButton
            onDelete={hapus}
            redirectTo="/blog"
            konfirmasi={`Hapus artikel "${artikel.title.id}"? Tindakan ini tidak bisa dibatalkan.`}
          />
        </div>
      </div>

      <PostForm post={artikel} onSubmit={simpan} />
    </div>
  );
}
