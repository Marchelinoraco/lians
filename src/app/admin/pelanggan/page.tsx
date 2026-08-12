import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCustomers } from '@/queries/customers';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PelangganPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage();

  const { q } = await searchParams;
  const daftar = await getCustomers(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Pelanggan</h1>
        <Link
          href="/pelanggan/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah pelanggan
        </Link>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Cari nama atau nomor…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-lians-400"
        >
          Cari
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Email</th>
              <th className="p-4">Terakhir diperbarui</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/pelanggan/${c.id}`} className="font-semibold text-lians-700">
                    {c.name}
                  </Link>
                </td>
                <td className="p-4">{c.phone}</td>
                <td className="p-4">{c.email ?? '—'}</td>
                <td className="p-4">{formatTanggal(new Date(c.updatedAt), 'id')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">
            {q
              ? 'Tidak ada pelanggan yang cocok.'
              : 'Belum ada pelanggan. Daftar ini terisi sendiri setiap kali ada pesanan masuk.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
