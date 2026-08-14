import Link from 'next/link';
import {
  Clock,
  CalendarCheck,
  Wallet,
  Car,
  Plus,
  PencilLine,
  Images,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { getBookings } from '@/queries/bookings';
import { getAllVehicles } from '@/queries/vehicles';
import { hitungKekurangan, hitungIsiSitus } from '@/queries/kelengkapan';
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

  const [semuaBooking, armada, kekurangan, isiSitus] = await Promise.all([
    getBookings(),
    getAllVehicles(),
    hitungKekurangan(),
    hitungIsiSitus(),
  ]);

  const pending = semuaBooking.filter((b) => b.status === 'pending');

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);

  const bulanIni = semuaBooking.filter((b) => new Date(b.createdAt) >= awalBulan);
  const nilaiBulanIni = bulanIni
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((jml, b) => jml + (b.totalPrice ?? 0), 0);

  const kartu = [
    {
      label: 'Menunggu',
      nilai: String(pending.length),
      Icon: Clock,
      warna: pending.length > 0 ? 'text-amber-600' : 'text-slate-400',
      latar: pending.length > 0 ? 'bg-amber-50' : 'bg-slate-100',
    },
    {
      label: 'Pesanan bulan ini',
      nilai: String(bulanIni.length),
      Icon: CalendarCheck,
      warna: 'text-lians-600',
      latar: 'bg-lians-50',
    },
    // Nilai rupiah hanya untuk super admin. Admin biasa tetap melihat pesanan
    // satu per satu berikut harganya — yang ditutup hanya angka totalnya.
    ...(superAdmin
      ? [
          {
            label: 'Nilai terkonfirmasi',
            nilai: formatRupiah(nilaiBulanIni),
            Icon: Wallet,
            warna: 'text-emerald-600',
            latar: 'bg-emerald-50',
          },
        ]
      : []),
    {
      label: 'Kendaraan tayang',
      nilai: `${armada.filter((v) => v.isPublished).length} / ${armada.length}`,
      Icon: Car,
      warna: 'text-slate-600',
      latar: 'bg-slate-100',
    },
  ];

  const aksi = [
    { href: '/booking/manual', label: 'Catat booking manual', Icon: Plus },
    { href: '/armada/baru', label: 'Tambah kendaraan', Icon: Car },
    { href: '/blog/baru', label: 'Tulis artikel', Icon: PencilLine },
    { href: '/galeri', label: 'Unggah foto galeri', Icon: Images },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Dasbor</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="truncate text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${k.latar}`}>
                <k.Icon className={`h-4 w-4 ${k.warna}`} aria-hidden />
              </span>
            </div>
            <p className="text-2xl font-black tabular-nums">{k.nilai}</p>
          </div>
        ))}
      </div>

      {/* Aksi cepat: empat hal yang paling sering dikerjakan, supaya dasbor
          bukan sekadar tempat melihat angka lalu mencari menu di sebelah. */}
      <section>
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Aksi cepat</h2>
        <div className="flex flex-wrap gap-2">
          {aksi.map(({ href, label, Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold transition-colors hover:border-lians-300 hover:text-lians-700"
            >
              <Icon className="h-4 w-4 text-lians-500" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem] lg:items-start">
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

        {/* Daftar isi yang masih kosong. Tanpa ini, dasbor pada hari-hari sepi
            hanya menampilkan angka nol dan tidak memberi tahu apa pun tentang
            hal yang justru membuat situs terlihat setengah jadi. */}
        <aside className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold">Perlu perhatian</h2>

          {kekurangan.length === 0 ? (
            <p className="flex items-start gap-2 text-sm text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
              Semua isi situs sudah lengkap.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {kekurangan.map((k) => (
                <li key={k.pesan}>
                  <Link
                    href={k.href}
                    className="group flex items-start gap-2 text-sm transition-colors hover:text-lians-700"
                  >
                    <AlertTriangle
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        k.penting ? 'text-amber-500' : 'text-slate-300'
                      }`}
                      aria-hidden
                    />
                    <span className="flex-1">{k.pesan}</span>
                    <ArrowRight
                      className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300 transition-colors group-hover:text-lians-500"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <dl className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            {[
              { label: 'Kendaraan', n: isiSitus.armada },
              { label: 'Artikel', n: isiSitus.artikel },
              { label: 'Foto galeri', n: isiSitus.galeri },
            ].map((x) => (
              <div key={x.label}>
                <dd className="text-lg font-black tabular-nums">{x.n}</dd>
                <dt className="text-[11px] text-muted">{x.label}</dt>
              </div>
            ))}
          </dl>
        </aside>
      </div>
    </div>
  );
}
