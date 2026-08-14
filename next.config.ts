import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ada package-lock.json nyasar di direktori home, dan Turbopack menebak akar
  // proyek dari berkas lock terdekat. Dikunci agar build tidak bergantung pada
  // isi folder di luar repositori.
  turbopack: { root: path.resolve(import.meta.dirname) },

  // exceljs dan pdfkit membaca berkas pendukung dari disk saat dijalankan
  // (antara lain metrik font bawaan pdfkit). Bila ikut dipaketkan bundler,
  // berkas itu tidak terbawa dan ekspor gagal saat dijalankan, bukan saat
  // build — jadi keduanya dibiarkan sebagai paket luar.
  serverExternalPackages: ['exceljs', 'pdfkit'],

  // next/image menolak host luar yang tidak didaftarkan. Foto armada
  // diunggah ke Cloudinary, jadi domainnya harus diizinkan di sini.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      // Foto profil penulis ulasan Google. Wajib didaftarkan, kalau tidak
      // next/image menolaknya dan kartu ulasan tampil tanpa wajah.
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
    ],
  },

};

export default nextConfig;
