import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ada package-lock.json nyasar di direktori home, dan Turbopack menebak akar
  // proyek dari berkas lock terdekat. Dikunci agar build tidak bergantung pada
  // isi folder di luar repositori.
  turbopack: { root: path.resolve(import.meta.dirname) },

  // next/image menolak host luar yang tidak didaftarkan. Foto armada
  // diunggah ke Cloudinary, jadi domainnya harus diizinkan di sini.
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' }],
  },

  experimental: {
    // Situs ini punya beberapa root layout (publik dan admin) DAN root layout
    // publiknya berada di segmen dinamis [locale]. Dua-duanya membuat Next
    // tidak punya satu layout pun untuk menyusun halaman 404 global, sehingga
    // URL tak dikenal yang tidak melewati proxy — yaitu yang berekstensi
    // berkas, misalnya /gambar-lama.png — berakhir 500, bukan 404.
    // app/global-not-found.tsx menutup celah itu.
    globalNotFound: true,
  },
};

export default nextConfig;
