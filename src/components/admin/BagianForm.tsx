import type { ReactNode } from 'react';

/**
 * Satu kelompok isian di dalam form admin, berjudul dan berpembatas.
 *
 * Form kendaraan punya delapan belas isian. Dideret lurus, semuanya tampak
 * sama pentingnya dan orang harus membaca setiap label untuk menemukan yang
 * dicari. Dikelompokkan — identitas, tarif, foto — mata cukup melompat antar
 * judul.
 */
export function BagianForm({
  judul,
  keterangan,
  children,
}: {
  judul: string;
  keterangan?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-4">
        <h2 className="font-bold">{judul}</h2>
        {keterangan ? <p className="mt-0.5 text-sm text-muted">{keterangan}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** Dua kolom di layar lebar, satu kolom di ponsel. */
export function KolomForm({ children }: { children: ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}

/**
 * Baris tombol yang menempel di bawah layar.
 *
 * Pada form panjang, tombol simpan di ujung halaman berarti harus menggulir
 * ke bawah setiap kali mengubah satu isian di bagian atas. Menempel di bawah,
 * tombolnya selalu ada tanpa perlu menebak posisinya.
 *
 * Lebarnya persis selebar kartu di atasnya — bukan selebar layar. Margin
 * negatif membuatnya menjorok keluar dari form yang lebarnya dibatasi, dan
 * yang terlihat adalah pita putih yang tidak lurus dengan apa pun.
 */
export function AksiForm({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-lg shadow-slate-900/10">
      {children}
    </div>
  );
}
