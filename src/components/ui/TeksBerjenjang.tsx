import { Fragment, type CSSProperties } from 'react';

/**
 * Menampilkan teks yang naik kata demi kata, berjenjang.
 *
 * Tidak memerlukan JavaScript: animasinya berjalan saat halaman dimuat, dan
 * jeda tiap kata dikirim sebagai variabel CSS.
 *
 * Bahasa Mandarin ditulis tanpa spasi antar-kata, sehingga pemisahan
 * menghasilkan satu potong saja. Membungkusnya sebagai satu `inline-block`
 * akan membuatnya TIDAK BISA berganti baris dan meluber di layar sempit —
 * karena itu teks tanpa spasi dianimasikan sebagai satu blok utuh.
 */
export function TeksBerjenjang({
  teks,
  jeda = 0.055,
  mulai = 0,
  className,
}: {
  teks: string;
  /** Jarak waktu antar kata, dalam detik. */
  jeda?: number;
  /** Penundaan sebelum kata pertama, dalam detik. */
  mulai?: number;
  className?: string;
}) {
  const kata = teks.split(/\s+/).filter(Boolean);

  if (kata.length <= 1) {
    return (
      <span
        className={`kata-muncul ${className ?? ''}`}
        style={{ '--jeda': `${mulai}s`, display: 'block' } as CSSProperties}
      >
        {teks}
      </span>
    );
  }

  return (
    <span className={className}>
      {kata.map((k, i) => (
        <Fragment key={`${k}-${i}`}>
          {/* Spasi ditaruh DI LUAR span. Di dalam elemen inline-block, spasi
              di tepi diciutkan peramban, dan kata-katanya akan menempel. */}
          {i > 0 ? ' ' : null}
          <span
            className="kata-muncul"
            style={{ '--jeda': `${mulai + i * jeda}s` } as CSSProperties}
          >
            {k}
          </span>
        </Fragment>
      ))}
    </span>
  );
}
