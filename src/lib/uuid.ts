/**
 * Apakah teks ini berbentuk UUID?
 *
 * Postgres menolak nilai yang bukan UUID pada kolom bertipe uuid dengan galat
 * 22P02, dan galat itu naik sebagai 500. Akibatnya alamat salah ketik seperti
 * /booking/baru menampilkan "Terjadi kesalahan" — seolah panelnya rusak,
 * padahal yang terjadi hanyalah halaman itu tidak ada. Diperiksa lebih dulu,
 * kuerinya tidak dijalankan dan halaman dapat membalas 404 dengan jujur.
 */
export function berbentukUuid(nilai: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(nilai);
}
