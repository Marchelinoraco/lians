import { hitungRekap } from '@/queries/rekap';
import { formatRupiah } from '@/lib/format';
import { requireSuperAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

function rentangBulan(param?: string): { dari: Date; sampai: Date; label: string; nilai: string } {
  const acuan = param && /^\d{4}-\d{2}$/.test(param) ? new Date(`${param}-01`) : new Date();
  const dari = new Date(acuan.getFullYear(), acuan.getMonth(), 1);
  // Tanggal 0 bulan berikutnya adalah hari terakhir bulan ini, jadi Februari
  // dan tahun kabisat ikut benar tanpa daftar panjang hari per bulan.
  const sampai = new Date(acuan.getFullYear(), acuan.getMonth() + 1, 0, 23, 59, 59);

  const label = dari.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const nilai = `${dari.getFullYear()}-${String(dari.getMonth() + 1).padStart(2, '0')}`;
  return { dari, sampai, label, nilai };
}

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  await requireSuperAdminPage();

  const { bulan } = await searchParams;
  const { dari, sampai, label, nilai } = rentangBulan(bulan);
  const rekap = await hitungRekap(dari, sampai);

  const kartu = [
    { label: 'Pendapatan', nilai: formatRupiah(rekap.pendapatan), tekan: true },
    { label: 'Biaya ke pemasok', nilai: formatRupiah(rekap.biayaPemasok), tekan: false },
    { label: 'Margin', nilai: formatRupiah(rekap.margin), tekan: true },
    { label: 'Utang belum dibayar', nilai: formatRupiah(rekap.utangBelumLunas), tekan: false },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Rekap Keuangan</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <form method="get" className="flex gap-2">
          <input
            type="month"
            name="bulan"
            defaultValue={nilai}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400"
          >
            Tampilkan
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-5 ${
              k.tekan ? 'border-lians-200 bg-lians-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-2xl font-black">{k.nilai}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted">
        Utang belum dibayar dihitung dari seluruh pesanan, tanpa batas bulan — utang bulan lalu tetap
        utang hari ini.
      </p>

      <section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-bold">Asal pesanan</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Dari situs</dt>
            <dd className="font-semibold">{rekap.jumlahWebsite}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Dicatat manual</dt>
            <dd className="font-semibold">{rekap.jumlahManual}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
            <dt>Total pesanan terkonfirmasi</dt>
            <dd>{rekap.jumlahPesanan}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Pesanan yang masih menunggu konfirmasi dan yang dibatalkan tidak dihitung.
        </p>
      </section>
    </div>
  );
}
