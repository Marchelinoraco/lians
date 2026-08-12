import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllVehicles } from '@/queries/vehicles';
import { formatRupiah } from '@/lib/format';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function ArmadaPage() {
  await requireAdminPage();
  const armada = await getAllVehicles();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Armada</h1>
        <Link
          href="/armada/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah kendaraan
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Lepas kunci</th>
              <th className="p-4">Pelayanan</th>
              <th className="p-4">Foto</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tayang</th>
            </tr>
          </thead>
          <tbody>
            {armada.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/armada/${v.id}`} className="font-semibold text-lians-700">
                    {v.name}
                  </Link>
                </td>
                <td className="p-4 capitalize">{v.category}</td>
                <td className="p-4">
                  {v.rateLepasKunci === null ? '—' : formatRupiah(v.rateLepasKunci)}
                </td>
                <td className="p-4">
                  {v.ratePelayanan === null ? '—' : formatRupiah(v.ratePelayanan)}
                </td>
                <td className="p-4">{v.images.length}</td>
                <td className="p-4">{v.status === 'available' ? 'Tersedia' : 'Tersewa'}</td>
                <td className="p-4">{v.isPublished ? 'Ya' : 'Tidak'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {armada.length === 0 ? (
          <p className="p-12 text-center text-muted">
            Belum ada kendaraan. Tambahkan yang pertama.
          </p>
        ) : null}
      </div>
    </div>
  );
}
