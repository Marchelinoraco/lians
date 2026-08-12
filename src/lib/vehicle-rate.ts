import type { VehiclePricing } from '@/lib/pricing';

/**
 * Tarif termurah yang tersedia, dipakai untuk pengurutan katalog dan filter
 * harga maksimum. Kendaraan bisa saja hanya menyediakan salah satu kategori.
 */
export function tarifTerendah(v: VehiclePricing): number | null {
  const tersedia = [v.rateLepasKunci, v.ratePelayanan].filter((n): n is number => n !== null);
  return tersedia.length === 0 ? null : Math.min(...tersedia);
}
