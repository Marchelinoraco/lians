/**
 * Cap logo LIANS pada foto kendaraan.
 *
 * Dikerjakan Cloudinary saat gambar disajikan, bukan saat diunggah. Berkas asli
 * di Cloudinary tetap bersih, sehingga letak, ukuran, atau keberadaan capnya
 * dapat diubah kelak dengan menyunting satu baris di sini — tanpa mengunggah
 * ulang satu pun foto.
 *
 * Arti tiap bagiannya:
 *   l_lians:logo-biru   lapisan logo; titik dua, bukan garis miring, karena
 *                       begitulah Cloudinary menulis jalur folder di overlay
 *   w_0.16,fl_relative  lebarnya 16% lebar foto, bukan piksel tetap — cap yang
 *                       pas di foto besar akan menutupi mobil di foto kecil
 *   g_south_east        pojok kanan bawah, tempat paling jarang memuat wajah
 *                       mobil pada foto katalog
 *   o_75                agak tembus pandang; cap pekat terbaca sebagai
 *                       kerusakan gambar, bukan sebagai tanda kepemilikan
 *
 * Dipakai logo BIRU, bukan putih. Seluruh foto katalog saat ini adalah render
 * pabrikan berlatar putih, dan logo putih di atasnya sama sekali tidak
 * terlihat. Bila kelak katalog diisi foto asli di luar ruangan yang cenderung
 * gelap, tukar `logo-biru` menjadi `logo-putih` di baris berikut — keduanya
 * sudah terunggah oleh scripts/unggah-logo-cap.mjs.
 */
export const CAP_LOGO = 'l_lians:logo-biru,w_0.16,fl_relative,g_south_east,x_0.04,y_0.04,o_75';

const PENANDA = '/image/upload/';

/**
 * Menyisipkan cap ke URL Cloudinary. URL dari sumber lain dikembalikan apa
 * adanya: data contoh dan kendaraan lama memakai tautan luar, dan menyisipkan
 * parameter Cloudinary ke sana hanya menghasilkan gambar yang gagal dimuat.
 */
export function denganCapLogo(url: string): string {
  if (!url.includes(PENANDA)) return url;
  if (url.includes(CAP_LOGO)) return url;

  return url.replace(PENANDA, `${PENANDA}${CAP_LOGO}/`);
}
