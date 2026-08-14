import Link from 'next/link';
import { PostForm } from '@/components/admin/PostForm';
import { createPost } from '@/actions/admin-posts';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function ArtikelBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/blog" className="text-sm text-muted hover:text-lians-600">
          ← Kembali ke daftar
        </Link>
        <h1 className="text-2xl font-black">Tulis Artikel</h1>
      </div>
      <PostForm post={null} onSubmit={createPost} />
    </div>
  );
}
