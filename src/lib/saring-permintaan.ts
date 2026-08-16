import type { FilterEkspor } from './ekspor-pesanan';

/** Bentuk minimum yang dibutuhkan penyaring — berlaku untuk tur dan tiket. */
type DapatDisaring = { status: string; createdAt: Date };

/**
 * Menyaring permintaan menurut status dan rentang tanggal masuk.
 *
 * Sengaja terpisah dari `saringPesanan`: yang disaring di sana punya kolom
 * uang dan tanggal mulai sewa, sedangkan di sini tidak. Menggabungkan keduanya
 * lewat satu tipe serba-boleh hanya memindahkan perbedaannya ke dalam if.
 */
export function saringPermintaan<T extends DapatDisaring>(semua: T[], filter: FilterEkspor): T[] {
  return semua.filter((r) => {
    if (filter.status && r.status !== filter.status) return false;

    const masuk = new Date(r.createdAt).toISOString().slice(0, 10);
    if (filter.dari && masuk < filter.dari) return false;
    // Perbandingan string tanggal ISO aman karena panjangnya tetap dan urutan
    // leksikografisnya sama dengan urutan kronologisnya.
    if (filter.sampai && masuk > filter.sampai) return false;

    return true;
  });
}
