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

/**
 * Menyamakan rasio gambar dengan kotak 4:3 tempatnya tampil, SEBELUM dicap.
 *
 * Tanpa ini capnya ikut terpotong. Kartu katalog dan galeri sama-sama memakai
 * `aspect-[4/3] object-cover`, sedangkan render pabrikan berbanding sekitar
 * 1,7:1 — peramban memangkas hampir seperempat lebarnya di kiri dan kanan, dan
 * pojok kanan bawah tempat logo berdiri adalah yang pertama hilang.
 *
 * `c_pad` menambahkan ruang, bukan memangkas: seluruh badan mobil tetap utuh.
 * `b_auto` mengambil warna dari tepi gambar, sehingga ruang tambahannya
 * menyatu dan tidak terlihat sebagai bingkai yang ditempelkan.
 *
 * Urutannya penting. Dituliskan sesudah cap, logonya akan diukur dan
 * diletakkan terhadap gambar yang belum dilebarkan, lalu ikut bergeser saat
 * ruang tambahannya muncul.
 */
export const RASIO_KATALOG = 'c_pad,ar_4:3,b_auto';

/** Rantai penuh yang disisipkan ke URL: samakan rasionya dulu, baru dicap. */
export const OLAHAN_KATALOG = `${RASIO_KATALOG}/${CAP_LOGO}`;

const PENANDA = '/image/upload/';

/**
 * Menyisipkan cap ke URL Cloudinary. URL dari sumber lain dikembalikan apa
 * adanya: data contoh dan kendaraan lama memakai tautan luar, dan menyisipkan
 * parameter Cloudinary ke sana hanya menghasilkan gambar yang gagal dimuat.
 */
export function denganCapLogo(url: string): string {
  if (!url.includes(PENANDA)) return url;
  if (url.includes(CAP_LOGO)) return url;

  return url.replace(PENANDA, `${PENANDA}${OLAHAN_KATALOG}/`);
}
