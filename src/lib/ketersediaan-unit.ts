/**
 * Ketersediaan unit armada LIANS.
 *
 * Semuanya berupa peringatan, tidak pernah penghalang. Unit yang bentrok
 * diselesaikan dengan menyewa dari pemasok, bukan dengan menolak pesanan —
 * jadi yang dibutuhkan admin adalah pemberitahuan, bukan tombol yang terkunci.
 */

export type Rentang = { startDate: string; endDate: string | null };

/**
 * Tanggal ISO dibandingkan sebagai string apa adanya: panjangnya tetap dan
 * urutan leksikografisnya sama dengan urutan kronologisnya, sehingga tidak ada
 * penguraian tanggal yang bisa tergelincir zona waktu.
 *
 * Tanggal selesai yang kosong dianggap sewa sehari. Pesanan lama dicatat
 * sebelum tanggal selesai diwajibkan, dan menganggapnya tak berujung akan
 * memblokir unit itu selamanya.
 */
export function rentangBertumpuk(a: Rentang, b: Rentang): boolean {
  const akhirA = a.endDate || a.startDate;
  const akhirB = b.endDate || b.startDate;

  // Batasnya inklusif di kedua ujung: unit yang kembali tanggal 14 tidak bisa
  // berangkat lagi tanggal 14 dengan penyewa lain, karena hari itu masih
  // terpakai sampai kendaraannya benar-benar dikembalikan.
  return a.startDate <= akhirB && b.startDate <= akhirA;
}

/**
 * Menyeragamkan penulisan nomor polisi.
 *
 * "B7195QF" dan "b 7195 qf" adalah kendaraan yang sama. Tanpa disamakan,
 * keduanya tersimpan sebagai dua unit terpisah dan hitungan ketersediaannya
 * menjadi dobel — persis kesalahan yang fitur ini seharusnya cegah.
 */
export function normalisasiNopol(nopol: string): string {
  const bersih = nopol.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Pola pelat Indonesia: huruf wilayah, angka, huruf akhir.
  const bagian = bersih.match(/^([A-Z]{1,2})(\d{1,4})([A-Z]{0,3})$/);
  if (!bagian) return nopol.trim().toUpperCase().replace(/\s+/g, ' ');

  return [bagian[1], bagian[2], bagian[3]].filter(Boolean).join(' ');
}
