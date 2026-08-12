import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSuppliers, getUtangPemasok } from '@/queries/suppliers';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PemasokPage() {
  await requireAdminPage();

  const [daftar, utang] = await Promise.all([getSuppliers(), getUtangPemasok()]);
  const totalUtang = utang.reduce((jml, u) => jml + u.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Pemasok</h1>
        <Link
          href="/pemasok/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah pemasok
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Belum dibayar</h2>
          <p className="text-xl font-black text-amber-700">{formatRupiah(totalUtang)}</p>
        </div>

        {utang.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted">
            Tidak ada utang ke pemasok. Semua pesanan berkendaraan pinjaman sudah lunas.
          </p>
        ) : (
          <div className="space-y-4">
            {utang.map((u) => (
              <div
                key={u.supplierId}
                className="rounded-2xl border border-amber-200 bg-amber-50 p-5"
              >
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/pemasok/${u.supplierId}`} className="font-bold text-lians-700">
                    {u.supplierName}
                  </Link>
                  <span className="font-black text-amber-800">{formatRupiah(u.total)}</span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {u.pesanan.map((p) => (
                    <li key={p.bookingId} className="flex flex-wrap justify-between gap-2">
                      <Link href={`/booking/${p.bookingId}`} className="text-slate-700 underline">
                        {p.bookingCode} · {p.vehicleName} ·{' '}
                        {formatTanggal(new Date(p.startDate), 'id')}
                      </Link>
                      <span className="font-semibold">{formatRupiah(p.cost ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/pemasok/${s.id}`} className="font-semibold text-lians-700">
                    {s.name}
                  </Link>
                </td>
                <td className="p-4">{s.phone ?? '—'}</td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      s.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {s.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">
            Belum ada pemasok. Tambahkan rekanan yang kendaraannya sering Anda pinjam.
          </p>
        ) : null}
      </section>
    </div>
  );
}
