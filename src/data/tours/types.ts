import type { Localized } from '@/i18n';

/**
 * Satu langkah dalam rangkaian acara. `time` opsional dan sengaja begitu:
 * sebagian paket menerbitkan jamnya, sebagian hanya urutannya. Mengarang jam
 * untuk paket yang tidak punya berarti menjanjikan ketepatan yang tidak ada.
 */
export type TourStep = {
  time?: string;
  title: Localized<string>;
};

export type TourDay = {
  label: Localized<string>;
  steps: TourStep[];
};

export type TourCategory = 'open-trip' | 'one-day' | 'multi-day';

/**
 * Paket wisata sebagai data statis di dalam repo — tidak ada tabel, tidak ada
 * CRUD. Mengubah paket berarti menyunting berkas dan menerbitkan ulang.
 *
 * Tidak ada kolom harga di sini, dan itu keputusan pemilik: seluruh paket
 * mengarah ke WhatsApp untuk penawaran. Menambahkan harga kelak berarti
 * menambah kolom, bukan mengisi kolom yang sengaja dibiarkan kosong.
 */
export type TourPackage = {
  slug: string;
  category: TourCategory;
  /** Dipakai untuk mengurutkan dan memeriksa kecocokan jumlah hari itinerary. */
  days: number;
  nights: number;
  name: Localized<string>;
  tagline: Localized<string>;
  duration: Localized<string>;
  destinations: Localized<string[]>;
  intro: Localized<string[]>;
  highlights: Localized<string[]>;
  itinerary: TourDay[];
  includes: Localized<string[]>;
  excludes: Localized<string[]>;
  meetingPoint?: Localized<string>;
  notes?: Localized<string[]>;
  /**
   * Nama berkas di dalam `public/tours/<slug>/`. Boleh kosong — halaman tetap
   * rapi tanpa foto, dan foto tinggal ditaruh di folder itu kemudian tanpa
   * menyentuh kode selain daftar ini.
   */
  images: string[];
  sortOrder: number;
};
