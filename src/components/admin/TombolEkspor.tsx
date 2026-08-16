'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';

/**
 * Tombol unduh untuk daftar admin mana pun.
 *
 * Rentang tanggal disediakan di sini, bukan mengikuti filter tabel: yang
 * dibutuhkan saat mengekspor hampir selalu "bulan lalu" atau "tahun ini",
 * sementara filter tabel hanya berdasarkan status.
 */
export function TombolEkspor({
  aksi,
  statusAktif,
  satuan = 'pesanan',
  catatanPeran,
}: {
  /** Alamat route ekspornya, misalnya "/booking/ekspor". */
  aksi: string;
  statusAktif?: string;
  /** Kata untuk menyebut isinya di teks bantuan. */
  satuan?: string;
  /**
   * Ditampilkan bila ada kolom yang disembunyikan dari peran ini. Daftar tanpa
   * kolom uang tidak menyembunyikan apa pun, jadi tidak perlu diisi.
   */
  catatanPeran?: string;
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [dari, setDari] = useState('');
  const [sampai, setSampai] = useState('');
  const wadah = useRef<HTMLDivElement>(null);
  const idPanel = useId();

  useEffect(() => {
    if (!terbuka) return;

    function klikDiLuar(e: MouseEvent) {
      if (!wadah.current?.contains(e.target as Node)) setTerbuka(false);
    }
    function tekanEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setTerbuka(false);
    }

    document.addEventListener('mousedown', klikDiLuar);
    document.addEventListener('keydown', tekanEscape);
    return () => {
      document.removeEventListener('mousedown', klikDiLuar);
      document.removeEventListener('keydown', tekanEscape);
    };
  }, [terbuka]);

  function tautan(format: 'xlsx' | 'pdf') {
    const q = new URLSearchParams({ format });
    if (statusAktif) q.set('status', statusAktif);
    if (dari) q.set('dari', dari);
    if (sampai) q.set('sampai', sampai);
    return `${aksi}?${q.toString()}`;
  }

  const kelasTanggal = 'w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm';

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        aria-controls={idPanel}
        className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold transition-colors hover:border-lians-400"
      >
        <Download className="h-4 w-4" aria-hidden />
        Ekspor
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${terbuka ? 'rotate-180' : ''}`}
          aria-hidden
        />
      </button>

      {terbuka ? (
        <div
          id={idPanel}
          className="absolute right-0 top-full z-50 mt-1 w-72 space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-lg"
        >
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="mb-1 block text-xs font-semibold">Dari tanggal</span>
              <input
                type="date"
                value={dari}
                onChange={(e) => setDari(e.target.value)}
                className={kelasTanggal}
              />
            </label>
            <label>
              <span className="mb-1 block text-xs font-semibold">Sampai</span>
              <input
                type="date"
                value={sampai}
                onChange={(e) => setSampai(e.target.value)}
                className={kelasTanggal}
              />
            </label>
          </div>

          <p className="text-xs text-muted">
            Dikosongkan berarti seluruh {satuan}.
            {statusAktif ? ' Filter status yang sedang aktif ikut diterapkan.' : null}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {/* Tautan biasa, bukan fetch: peramban menangani unduhannya sendiri
                sehingga berkas besar tidak perlu ditahan di memori halaman. */}
            <a
              href={tautan('xlsx')}
              onClick={() => setTerbuka(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <FileSpreadsheet className="h-4 w-4" aria-hidden />
              Excel
            </a>
            <a
              href={tautan('pdf')}
              onClick={() => setTerbuka(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <FileText className="h-4 w-4" aria-hidden />
              PDF
            </a>
          </div>

          {catatanPeran ? (
            <p className="border-t border-slate-100 pt-3 text-xs text-muted">{catatanPeran}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
