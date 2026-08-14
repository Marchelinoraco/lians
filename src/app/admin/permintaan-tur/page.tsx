import Link from 'next/link';
import { getTourRequests } from '@/queries/tour-requests';
import { formatTanggal } from '@/lib/dates';
import { PencarianAdmin } from '@/components/admin/PencarianAdmin';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

const LABEL_STATUS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const WARNA_STATUS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  completed: 'bg-slate-200 text-slate-700',
  cancelled: 'bg-red-100 text-red-800',
};

export default async function PermintaanTurPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPage();

  const { status, q } = await searchParams;
  const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
  const filter = status && valid.includes(status) ? (status as 'pending') : undefined;
  const semua = await getTourRequests(filter);

  const cari = q?.trim().toLowerCase();
  const daftar = cari
    ? semua.filter((r) =>
        [r.requestCode, r.customerName, r.phone, r.tourNameSnapshot]
          .filter(Boolean)
          .some((teks) => String(teks).toLowerCase().includes(cari)),
      )
    : semua;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Permintaan Tur</h1>
        <p className="mt-1 text-sm text-muted">
          Paket wisatanya statis di dalam kode; yang tercatat di sini adalah permintaan penawaran
          yang masuk lewat situs.
        </p>
      </div>

      <PencarianAdmin
        nilai={q}
        placeholder="Cari kode, nama, atau paket…"
        aksi="/permintaan-tur"
        tersembunyi={{ status: filter }}
        jumlah={daftar.length}
      />

      <nav className="flex flex-wrap gap-2">
        <Link
          href={q ? `/permintaan-tur?q=${encodeURIComponent(q)}` : '/permintaan-tur'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!filter ? 'bg-lians-50 text-lians-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Semua
        </Link>
        {valid.map((s) => (
          <Link
            key={s}
            href={`/permintaan-tur?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === s ? 'bg-lians-50 text-lians-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {LABEL_STATUS[s]}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Kode</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Paket</th>
              <th className="p-4">Peserta</th>
              <th className="p-4">Mulai</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link
                    href={`/permintaan-tur/${r.id}`}
                    className="font-semibold text-lians-700"
                  >
                    {r.requestCode}
                  </Link>
                </td>
                <td className="p-4">
                  {r.customerName}
                  <span className="block text-xs text-muted">{r.phone}</span>
                </td>
                <td className="p-4">{r.tourNameSnapshot}</td>
                <td className="p-4">{r.pax} orang</td>
                <td className="p-4">{formatTanggal(new Date(r.startDate), 'id')}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${WARNA_STATUS[r.status]}`}
                  >
                    {LABEL_STATUS[r.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada permintaan pada filter ini.</p>
        ) : null}
      </div>
    </div>
  );
}
