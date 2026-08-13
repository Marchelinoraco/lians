import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import '@/app/globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '404 — Halaman tidak ditemukan | LIANS',
  description: 'Halaman yang Anda cari tidak ada atau sudah dipindahkan.',
};

/**
 * Halaman 404 untuk URL yang tidak cocok dengan rute mana pun.
 *
 * Diperlukan karena situs ini punya beberapa root layout (publik dan admin) dan
 * root layout publiknya berada di segmen dinamis [locale] — dua keadaan yang
 * membuat Next tidak punya satu layout untuk menyusun 404 global. Tanpa berkas
 * ini, URL berekstensi berkas yang tidak ada (misalnya /gambar-lama.png, yang
 * sengaja dilewatkan proxy agar aset statis tidak ditulis ulang) berakhir 500.
 *
 * Berkas ini melewati layout, jadi gaya dan fontnya diimpor sendiri di sini.
 *
 * Berbahasa Indonesia saja: pengunjung yang tersesat belum melewati pemilih
 * bahasa, dan menebak bahasanya di sini tidak sepadan dengan kerumitannya.
 */
export default function GlobalNotFound() {
  return (
    <html lang="id-ID" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-5xl font-black text-lians-500">404</p>
          <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
          <p className="max-w-md text-muted">
            Halaman yang Anda cari tidak ada atau sudah dipindahkan.
          </p>
          <a
            href="/"
            className="mt-2 rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600"
          >
            Kembali ke beranda
          </a>
        </main>
      </body>
    </html>
  );
}
