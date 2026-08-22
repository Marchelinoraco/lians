/**
 * Nama jenis layanan yang dibaca staf di panel admin.
 *
 * Satu tempat, bukan tiga. Sebelumnya daftar ini disalin di form booking
 * manual, halaman detail pesanan, dan form armada — dan ketiganya sudah
 * terlanjur berbeda: "Pariwisata" di satu tempat, "Bus / Hiace pariwisata" di
 * tempat lain. Penyebutan yang berbeda-beda membuat staf mengira keduanya dua
 * layanan yang berlainan.
 *
 * Situs publik memakai kamus i18n-nya sendiri karena harus berbahasa empat;
 * yang di sini khusus admin, yang memang hanya berbahasa Indonesia.
 */
export const JENIS_LAYANAN = ['self-drive', 'with-driver', 'tourism', 'travel'] as const;

export type JenisLayanan = (typeof JENIS_LAYANAN)[number];

/**
 * Namanya mengikuti kata yang sudah dipakai di model harga: enum tarif memang
 * `lepas-kunci` dan `pelayanan`. Menyebut hal yang sama dengan dua kata
 * berbeda — "Dengan sopir" di form, "Pelayanan" di tarif — memaksa staf
 * menerjemahkannya sendiri setiap kali.
 */
export const LABEL_LAYANAN: Record<JenisLayanan, string> = {
  'self-drive': 'Lepas Kunci',
  'with-driver': 'Pelayanan (BBM + sopir)',
  travel: 'Drop Off',
  // Tidak lagi ditawarkan pada pesanan baru, tetapi labelnya wajib tetap ada:
  // satu pesanan lama memakainya, dan tiga kendaraan masih menawarkannya di
  // katalog publik. Tanpa ini keduanya tampil sebagai kode mentah.
  tourism: 'Bus / Hiace pariwisata',
};

/**
 * Yang boleh dipilih saat mencatat pesanan baru.
 *
 * Pariwisata sengaja tidak ada. Sewa bus dicatat sebagai Pelayanan, karena
 * yang membedakannya memang hanya kendaraannya — dan kendaraan sudah dipilih
 * di bagian tersendiri.
 */
export const LAYANAN_PESANAN_BARU = ['self-drive', 'with-driver', 'travel'] as const;
