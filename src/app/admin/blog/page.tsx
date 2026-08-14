import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllPosts } from '@/queries/posts';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function BlogAdminPage() {
  await requireAdminPage();
  const daftar = await getAllPosts();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Blog</h1>
          <p className="mt-1 text-sm text-muted">
            Artikel baru berbawaan belum terbit. Centang &ldquo;Terbitkan&rdquo; saat sudah siap
            dibaca orang.
          </p>
        </div>
        <Link
          href="/blog/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tulis artikel
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Judul</th>
              <th className="p-4">Slug</th>
              <th className="p-4">Tanggal terbit</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((p) => (
              <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/blog/${p.id}`} className="font-semibold text-lians-700">
                    {p.title.id}
                  </Link>
                </td>
                <td className="p-4 text-muted">{p.slug}</td>
                <td className="p-4">{formatTanggal(new Date(p.publishedAt), 'id')}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      p.isPublished
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {p.isPublished ? 'Terbit' : 'Draf'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada artikel.</p>
        ) : null}
      </div>
    </div>
  );
}
