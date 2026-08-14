export type Blok =
  | { jenis: 'judul'; teks: string }
  | { jenis: 'paragraf'; teks: string }
  | { jenis: 'daftar'; butir: string[] };

/**
 * Menerjemahkan larik baris menjadi blok yang dapat dirender.
 *
 * Hanya dua tanda yang dikenali: '## ' untuk subjudul dan '- ' untuk butir
 * daftar. Sengaja sesedikit itu — setiap tanda tambahan berarti satu cara lagi
 * isi artikel berubah bentuk di luar dugaan penulisnya.
 *
 * Bukan Markdown, dan hasilnya dirender sebagai elemen React, bukan HTML.
 * Teks apa pun yang diketik staf tidak mungkin berubah menjadi markup.
 */
export function uraikanBlok(baris: string[]): Blok[] {
  const hasil: Blok[] = [];

  for (const mentah of baris) {
    const teks = mentah.trim();
    if (!teks) continue;

    if (teks.startsWith('## ')) {
      hasil.push({ jenis: 'judul', teks: teks.slice(3).trim() });
      continue;
    }

    if (teks.startsWith('- ')) {
      const butir = teks.slice(2).trim();
      const terakhir = hasil[hasil.length - 1];

      // Butir berurutan digabung menjadi satu daftar; begitu diselingi
      // paragraf, daftar berikutnya dimulai dari awal.
      if (terakhir?.jenis === 'daftar') terakhir.butir.push(butir);
      else hasil.push({ jenis: 'daftar', butir: [butir] });
      continue;
    }

    hasil.push({ jenis: 'paragraf', teks });
  }

  return hasil;
}
