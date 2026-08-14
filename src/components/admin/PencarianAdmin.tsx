import { Search, X } from 'lucide-react';
import { KELAS_ISIAN_IKON, KELAS_TOMBOL_KEDUA_KECIL } from './kelas-form';
import Link from 'next/link';

/**
 * Kotak pencarian untuk daftar admin.
 *
 * Berupa form GET biasa, bukan penyaring di sisi klien: hasilnya masuk ke URL,
 * sehingga halaman pencarian dapat ditandai, dibagikan, dan dibuka ulang lewat
 * tombol kembali. Penyaring klien kehilangan semuanya begitu halaman disegarkan.
 *
 * `tersembunyi` meneruskan filter lain yang sedang aktif — tanpa itu, mencari
 * sesuatu akan diam-diam menghapus filter status yang sedang dipakai.
 */
export function PencarianAdmin({
  nilai,
  placeholder,
  aksi,
  tersembunyi,
  jumlah,
}: {
  nilai?: string;
  placeholder: string;
  /** Path halaman ini, dipakai tombol hapus pencarian. */
  aksi: string;
  tersembunyi?: Record<string, string | undefined>;
  /** Jumlah hasil, ditampilkan hanya saat sedang mencari. */
  jumlah?: number;
}) {
  // Disaring lebih dulu supaya tipenya pasti string, bukan string | undefined.
  const sisa: [string, string][] = Object.entries(tersembunyi ?? {}).flatMap(([k, v]) =>
    v ? [[k, v] as [string, string]] : [],
  );

  return (
    <form method="get" action={aksi} className="flex flex-wrap items-center gap-2">
      {sisa.map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
        <input
          name="q"
          defaultValue={nilai ?? ''}
          placeholder={placeholder}
          aria-label={placeholder}
          className={`w-72 sm:w-80 ${KELAS_ISIAN_IKON}`}
        />
      </div>

      <button
        type="submit"
        className={KELAS_TOMBOL_KEDUA_KECIL}
      >
        Cari
      </button>

      {nilai ? (
        <>
          <Link
            href={sisa.length > 0 ? `${aksi}?${new URLSearchParams(sisa).toString()}` : aksi}
            className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:text-lians-600"
          >
            <X className="h-4 w-4" aria-hidden /> Hapus
          </Link>
          {jumlah !== undefined ? (
            <span className="text-sm text-muted">{jumlah} hasil</span>
          ) : null}
        </>
      ) : null}
    </form>
  );
}
