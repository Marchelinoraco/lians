import Link from 'next/link';
import { getBookings } from '@/queries/bookings';
import { getAllVehicles } from '@/queries/vehicles';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage, sesiSekarang } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function DasborPage() {
  // Wajib sebelum kueri apa pun: redirect di layout tidak menghentikan halaman
  // ini dari render, sehingga tanpa baris ini angka ringkasan ikut terkirim
  // dalam badan respons untuk permintaan tanpa sesi.
  await requireAdminPage();
  const superAdmin = (await sesiSekarang())?.role === 'super_admin';

  const [semuaBooking, armada] = await Promise.all([getBookings(), getAllVehicles()]);
  const pending = semuaBooking.filter((b) => b.status === 'pending');

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  const bulanIni = semuaBooking.filter((b) => new Date(b.createdAt) >= awalBulan);
  const nilaiBulanIni = bulanIni
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((jml, b) => jml + (b.totalPrice ?? 0), 0);

  const kartu = [
    { label: 'Menunggu konfirmasi', nilai: String(pending.length) },
    { label: 'Pesanan bulan ini', nilai: String(bulanIni.length) },
    // Nilai rupiah hanya untuk super admin. Admin biasa tetap melihat pesanan
    // satu per satu berikut harganya — yang ditutup hanya angka totalnya.
    ...(superAdmin
      ? [{ label: 'Nilai pesanan terkonfirmasi', nilai: formatRupiah(nilaiBulanIni) }]
      : []),
    {
      label: 'Kendaraan tayang',
      nilai: `${armada.filter((v) => v.isPublished).length} / ${armada.length}`,
    },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Dasbor</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-2xl font-black">{k.nilai}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Pesanan menunggu konfirmasi</h2>
          <Link href="/booking" className="text-sm font-semibold text-lians-600">
            Lihat semua →
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted">
            Tidak ada pesanan yang menunggu. Semua sudah ditindaklanjuti.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.slice(0, 8).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/booking/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-lians-300"
                >
                  <div>
                    <p className="font-semibold">
                      {b.customerName} — {b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—'}
                    </p>
                    <p className="text-xs text-muted">
                      {b.bookingCode} · {formatTanggal(new Date(b.startDate), 'id')}
                    </p>
                  </div>
                  <span className="font-bold text-lians-600">
                    {b.totalPrice === null ? 'Menunggu penawaran' : formatRupiah(b.totalPrice)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
