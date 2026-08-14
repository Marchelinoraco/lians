import Link from 'next/link';
import { getTicketRequests } from '@/queries/ticket-requests';
import { namaMaskapai } from '@/data/maskapai';
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

export default async function PermintaanTiketPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPage();

  const { status, q } = await searchParams;
  const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
  const filter = status && valid.includes(status) ? (status as 'pending') : undefined;
  const semua = await getTicketRequests(filter);

  const cari = q?.trim().toLowerCase();
  const daftar = cari
    ? semua.filter((r) =>
        [r.requestCode, r.customerName, r.phone, r.origin, r.destination]
          .filter(Boolean)
          .some((teks) => String(teks).toLowerCase().includes(cari)),
      )
    : semua;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Permintaan Tiket</h1>
        <p className="mt-1 text-sm text-muted">
          Harga tidak tercatat di sini — tarif penerbangan berubah tiap jam, jadi penawarannya
          disepakati lewat WhatsApp.
        </p>
      </div>

      <PencarianAdmin
        nilai={q}
        placeholder="Cari kode, nama, atau kota…"
        aksi="/permintaan-tiket"
        tersembunyi={{ status: filter }}
        jumlah={daftar.length}
      />

      <nav className="flex flex-wrap gap-2">
        <Link
          href={q ? `/permintaan-tiket?q=${encodeURIComponent(q)}` : '/permintaan-tiket'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!filter ? 'bg-lians-50 text-lians-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Semua
        </Link>
        {valid.map((s) => (
          <Link
            key={s}
            href={`/permintaan-tiket?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
              <th className="p-4">Rute</th>
              <th className="p-4">Maskapai</th>
              <th className="p-4">Berangkat</th>
              <th className="p-4">Pax</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((r) => (
              <tr key={r.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/permintaan-tiket/${r.id}`} className="font-semibold text-lians-700">
                    {r.requestCode}
                  </Link>
                </td>
                <td className="p-4">
                  {r.customerName}
                  <span className="block text-xs text-muted">{r.phone}</span>
                </td>
                <td className="p-4">
                  {r.origin} → {r.destination}
                </td>
                <td className="p-4">
                  {namaMaskapai(r.airline) ?? (
                    <span className="text-amber-700">Belum menentukan</span>
                  )}
                </td>
                <td className="p-4">{formatTanggal(new Date(r.departureDate), 'id')}</td>
                <td className="p-4">{r.pax}</td>
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
