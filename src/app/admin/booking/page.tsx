import Link from 'next/link';
import { Plus } from 'lucide-react';
import { TombolEkspor } from '@/components/admin/TombolEkspor';
import { PencarianAdmin } from '@/components/admin/PencarianAdmin';
import { getBookings } from '@/queries/bookings';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage, sesiSekarang } from '@/actions/auth-guard';

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

export default async function BookingListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireAdminPage();
  const superAdmin = (await sesiSekarang())?.role === 'super_admin';

  const { status, q } = await searchParams;
  const valid = ['pending', 'confirmed', 'completed', 'cancelled'];
  const filter = status && valid.includes(status) ? (status as 'pending') : undefined;
  const semua = await getBookings(filter);

  // Dicari di sisi server pada data yang sudah diambil: jumlah pesanan sebuah
  // rental muat di memori, dan kueri ILIKE tiga kolom untuk itu justru lebih
  // mahal daripada menyaringnya di sini.
  const cari = q?.trim().toLowerCase();
  const daftar = cari
    ? semua.filter((b) =>
        [b.bookingCode, b.customerName, b.phone, b.vehicleNameSnapshot, b.routeNameSnapshot]
          .filter(Boolean)
          .some((teks) => String(teks).toLowerCase().includes(cari)),
      )
    : semua;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Booking</h1>
        <div className="flex flex-wrap items-center gap-2">
          <TombolEkspor
          aksi="/booking/ekspor"
          statusAktif={filter}
          catatanPeran={
            superAdmin ? undefined : 'Kolom harga dan margin tidak disertakan pada akun staf.'
          }
        />
          <Link
            href="/booking/manual"
            className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
          >
            <Plus className="h-4 w-4" aria-hidden /> Catat booking manual
          </Link>
        </div>
      </div>

      <PencarianAdmin
        nilai={q}
        placeholder="Cari kode, nama, atau nomor…"
        aksi="/booking"
        tersembunyi={{ status: filter }}
        jumlah={daftar.length}
      />

      <nav className="flex flex-wrap gap-2">
        <Link
          href={q ? `/booking?q=${encodeURIComponent(q)}` : '/booking'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!filter ? 'bg-lians-50 text-lians-700' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Semua
        </Link>
        {valid.map((s) => (
          <Link
            key={s}
            href={`/booking?status=${s}${q ? `&q=${encodeURIComponent(q)}` : ''}`}
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
              <th className="p-4">Asal</th>
              <th className="p-4">Pelanggan</th>
              <th className="p-4">Pesanan</th>
              <th className="p-4">Mulai</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/booking/${b.id}`} className="font-semibold text-lians-700">
                    {b.bookingCode}
                  </Link>
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      b.source === 'manual'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-lians-50 text-lians-700'
                    }`}
                  >
                    {b.source === 'manual' ? 'Manual' : 'Website'}
                  </span>
                </td>
                <td className="p-4">
                  {b.customerName}
                  <span className="block text-xs text-muted">{b.phone}</span>
                </td>
                <td className="p-4">{b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—'}</td>
                <td className="p-4">{formatTanggal(new Date(b.startDate), 'id')}</td>
                <td className="p-4">
                  {b.totalPrice === null ? 'Menunggu penawaran' : formatRupiah(b.totalPrice)}
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${WARNA_STATUS[b.status]}`}
                  >
                    {LABEL_STATUS[b.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada pesanan pada filter ini.</p>
        ) : null}
      </div>
    </div>
  );
}
