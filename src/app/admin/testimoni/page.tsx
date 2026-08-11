import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { getAllTestimonials } from '@/queries/testimonials';
import { formatTanggal } from '@/lib/dates';
import { pickLocale } from '@/i18n';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function TestimoniListPage() {
  await requireAdminPage();
  const semua = await getAllTestimonials();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Testimoni</h1>
        <Link
          href="/testimoni/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah testimoni
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Rating</th>
              <th className="p-4">Ulasan</th>
              <th className="p-4">Tanggal</th>
              <th className="p-4">Beranda</th>
              <th className="p-4">Tayang</th>
            </tr>
          </thead>
          <tbody>
            {semua.map((t) => (
              <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/testimoni/${t.id}`} className="font-semibold text-lians-700">
                    {t.customerName}
                  </Link>
                </td>
                <td className="p-4">
                  <span className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
                    {t.rating}
                  </span>
                </td>
                <td className="max-w-xs truncate p-4 text-muted">{pickLocale(t.reviewText, 'id')}</td>
                <td className="p-4">{formatTanggal(new Date(t.date), 'id')}</td>
                <td className="p-4">{t.isFeatured ? 'Ya' : '—'}</td>
                <td className="p-4">{t.isPublished ? 'Ya' : 'Tidak'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {semua.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada testimoni.</p>
        ) : null}
      </div>
    </div>
  );
}
