import { getAktivitas, getPelakuAktivitas } from '@/queries/aktivitas';
import { formatTanggal } from '@/lib/dates';
import { requireSuperAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

/** Kelompok aksi diberi warna agar penghapusan menonjol tanpa perlu dibaca. */
const WARNA: { awalan: string; kelas: string }[] = [
  { awalan: 'hapus', kelas: 'bg-red-100 text-red-800' },
  { awalan: 'buat', kelas: 'bg-emerald-100 text-emerald-800' },
  { awalan: 'reset', kelas: 'bg-amber-100 text-amber-800' },
];

function kelasAksi(aksi: string): string {
  const belakang = aksi.split('.')[1] ?? '';
  return WARNA.find((w) => belakang.startsWith(w.awalan))?.kelas ?? 'bg-slate-100 text-slate-700';
}

function jam(d: Date): string {
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Makassar' });
}

export default async function AktivitasPage({
  searchParams,
}: {
  searchParams: Promise<{ pelaku?: string; dari?: string; sampai?: string }>;
}) {
  await requireSuperAdminPage();

  const { pelaku, dari, sampai } = await searchParams;
  const [daftar, pelakuTersedia] = await Promise.all([
    getAktivitas({ userId: pelaku || undefined, dari, sampai }),
    getPelakuAktivitas(),
  ]);

  // Dikelompokkan per hari: pertanyaan yang membawa orang ke halaman ini hampir
  // selalu berbentuk "apa yang terjadi hari Selasa", bukan "baris ke berapa".
  const perHari = new Map<string, typeof daftar>();
  for (const a of daftar) {
    const kunci = formatTanggal(new Date(a.createdAt), 'id');
    perHari.set(kunci, [...(perHari.get(kunci) ?? []), a]);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Aktivitas</h1>
        <p className="mt-1 text-sm text-muted">
          Setiap perubahan data oleh staf, terbaru lebih dulu. Catatan di sini tidak dapat disunting
          maupun dihapus oleh siapa pun.
        </p>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Pelaku</span>
          <select
            name="pelaku"
            defaultValue={pelaku ?? ''}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Semua orang</option>
            {pelakuTersedia.map((p) => (
              <option key={p.userId ?? p.email} value={p.userId ?? ''}>
                {p.email}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Dari</span>
          <input type="date" name="dari" defaultValue={dari ?? ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-sm">
          <span className="mb-1 block font-semibold">Sampai</span>
          <input type="date" name="sampai" defaultValue={sampai ?? ''} className="rounded-lg border border-slate-300 px-3 py-2 text-sm" />
        </label>
        <button type="submit" className="rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600">
          Terapkan
        </button>
      </form>

      {daftar.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted">
          Belum ada aktivitas yang tercatat pada rentang ini.
        </p>
      ) : (
        <div className="space-y-6">
          {[...perHari.entries()].map(([hari, isi]) => (
            <section key={hari} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-3 font-bold">{hari}</h2>
              <ul className="divide-y divide-slate-100">
                {isi.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
                    <span className="w-12 shrink-0 text-xs text-muted">{jam(new Date(a.createdAt))}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${kelasAksi(a.action)}`}>
                      {a.action}
                    </span>
                    <span className="min-w-0 flex-1 text-sm">{a.summary}</span>
                    <span className="shrink-0 text-xs text-muted">{a.userEmailSnapshot}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}

          {daftar.length >= 200 ? (
            <p className="text-xs text-muted">
              Menampilkan 200 catatan terbaru. Persempit rentang tanggalnya untuk melihat yang lebih lama.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
