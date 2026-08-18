import { v2 as cloudinary } from 'cloudinary';
import { readFileSync } from 'node:fs';

/**
 * Mengunggah logo LIANS ke Cloudinary sebagai lapisan cap.
 *
 * Diunggah DUA warna. Yang dipakai ditentukan CAP_LOGO di src/lib/cap-logo.ts:
 * biru untuk foto berlatar terang seperti render katalog pabrikan, putih untuk
 * foto asli di luar ruangan yang cenderung gelap. Mengunggah keduanya membuat
 * pergantian itu cukup menyunting satu baris, tanpa menjalankan skrip lagi.
 *
 * Public ID-nya WAJIB persis seperti di bawah — itulah yang dirujuk CAP_LOGO.
 * Menggantinya di satu tempat saja membuat seluruh foto kendaraan gagal dimuat,
 * karena Cloudinary menolak URL yang menyebut lapisan yang tidak ada.
 *
 * Dijalankan sekali per akun Cloudinary. Aman diulang: overwrite dinyalakan,
 * jadi menjalankannya lagi hanya mengganti berkasnya dengan yang sama.
 *
 * Jalankan: node --env-file=.env.local scripts/unggah-logo-cap.mjs
 */
const LOGO = [
  ['public/logo-lians.png', 'lians/logo-biru'],
  ['public/logo-lians-putih.png', 'lians/logo-putih'],
];

if (!process.env.CLOUDINARY_URL) {
  console.error('CLOUDINARY_URL belum diatur.');
  process.exit(1);
}

for (const [berkas, publicId] of LOGO) {
  readFileSync(berkas); // gagal cepat bila berkasnya tidak ada

  const hasil = await cloudinary.uploader.upload(berkas, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
  });

  console.log(`terunggah  ${hasil.public_id.padEnd(18)} ${hasil.width}×${hasil.height}`);
}
