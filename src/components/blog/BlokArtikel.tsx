import { uraikanBlok } from '@/lib/blok-artikel';

/**
 * Menampilkan isi artikel.
 *
 * Setiap blok menjadi elemen React, tidak pernah `dangerouslySetInnerHTML`.
 * Artinya teks apa pun yang diketik staf — termasuk yang kebetulan menyerupai
 * tag HTML — tampil sebagai teks biasa, bukan dieksekusi peramban.
 */
export function BlokArtikel({ baris }: { baris: string[] }) {
  const blok = uraikanBlok(baris);

  return (
    <div className="space-y-5">
      {blok.map((b, i) => {
        if (b.jenis === 'judul') {
          return (
            <h2 key={i} className="pt-3 text-xl font-bold sm:text-2xl">
              {b.teks}
            </h2>
          );
        }

        if (b.jenis === 'daftar') {
          return (
            <ul key={i} className="space-y-2">
              {b.butir.map((butir, j) => (
                <li key={j} className="flex gap-3 leading-relaxed">
                  <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-lians-400" aria-hidden />
                  <span>{butir}</span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p key={i} className="leading-relaxed">
            {b.teks}
          </p>
        );
      })}
    </div>
  );
}
