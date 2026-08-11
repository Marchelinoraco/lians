import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllRoutes } from '@/queries/routes';
import { formatRupiah } from '@/lib/format';
import { pickLocale } from '@/i18n';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function RuteListPage() {
  await requireAdminPage();
  const rute = await getAllRoutes();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Rute Travel</h1>
        <Link
          href="/rute/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah rute
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Rute</th>
              <th className="p-4">Tarif</th>
              <th className="p-4">Waktu tempuh</th>
              <th className="p-4">Tayang</th>
            </tr>
          </thead>
          <tbody>
            {rute.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/rute/${r.id}`} className="font-semibold text-lians-700">
                    {r.origin} → {r.destination}
                  </Link>
                </td>
                <td className="p-4">
                  {r.price === null ? (
                    <span className="text-amber-700">Belum bertarif</span>
                  ) : (
                    formatRupiah(r.price)
                  )}
                </td>
                <td className="p-4">{pickLocale(r.estimatedDuration, 'id') ?? '—'}</td>
                <td className="p-4">{r.isPublished ? 'Ya' : 'Tidak'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {rute.length === 0 ? <p className="p-12 text-center text-muted">Belum ada rute.</p> : null}
      </div>
    </div>
  );
}
