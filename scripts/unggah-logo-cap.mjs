import { v2 as cloudinary } from 'cloudinary';
import { readFileSync } from 'node:fs';

/**
 * Mengunggah logo LIANS putih ke Cloudinary sebagai lapisan cap.
 *
 * Public ID-nya WAJIB `lians/logo-putih` — itulah yang dirujuk CAP_LOGO di
 * src/lib/cap-logo.ts sebagai `l_lians:logo-putih`. Menggantinya di satu tempat
 * saja membuat seluruh foto kendaraan gagal dimuat, karena Cloudinary menolak
 * URL yang menyebut lapisan yang tidak ada.
 *
 * Dijalankan sekali per akun Cloudinary. Aman diulang: overwrite dinyalakan,
 * jadi menjalankannya lagi hanya mengganti berkasnya dengan yang sama.
 *
 * Jalankan: node --env-file=.env.local scripts/unggah-logo-cap.mjs
 */
const berkas = 'public/logo-lians-putih.png';
const publicId = 'lians/logo-putih';

if (!process.env.CLOUDINARY_URL) {
  console.error('CLOUDINARY_URL belum diatur.');
  process.exit(1);
}

readFileSync(berkas); // gagal cepat bila berkasnya tidak ada

const hasil = await cloudinary.uploader.upload(berkas, {
  public_id: publicId,
  overwrite: true,
  invalidate: true,
});

console.log(`Logo cap terunggah: ${hasil.public_id} (${hasil.width}×${hasil.height})`);
console.log(hasil.secure_url);
