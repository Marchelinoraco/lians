/**
 * Satu-satunya tempat margin dihitung.
 *
 * Sebelumnya rumusnya ditulis ulang di halaman detail, rekap, dan ekspor.
 * Selama begitu, menambah satu pos biaya berarti tiga tempat harus diingat —
 * dan satu yang terlewat menghasilkan angka margin yang berbeda antara layar
 * dan berkas ekspor, tanpa ada yang tahu mana yang benar.
 */

/** Pos biaya yang menjadi tanggungan LIANS, terlepas dari siapa pemilik kendaraannya. */
export type PosBiaya = {
  costFuel: number | null;
  costDriver: number | null;
  costTollParking: number | null;
  costOther: number | null;
};

export type SumberMargin = PosBiaya & {
  totalPrice: number | null;
  supplierCost: number | null;
};

export function hitungBiayaOperasional(b: PosBiaya): number {
  return (b.costFuel ?? 0) + (b.costDriver ?? 0) + (b.costTollParking ?? 0) + (b.costOther ?? 0);
}

/**
 * Biaya operasional selalu ikut dikurangi — juga saat kendaraannya dari
 * pemasok. BBM, sopir, dan tol tetap keluar dari kantong LIANS meski mobilnya
 * pinjaman; menghitungnya sebagai margin akan membesar-besarkan untung.
 *
 * `null` bila harga ke pelanggan belum ditentukan, supaya tampil sebagai "—"
 * dan bukan "Rp 0" yang menyesatkan.
 */
export function hitungMargin(b: SumberMargin): number | null {
  if (b.totalPrice === null) return null;
  return b.totalPrice - (b.supplierCost ?? 0) - hitungBiayaOperasional(b);
}
