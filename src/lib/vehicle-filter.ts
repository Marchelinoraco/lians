import type { Vehicle } from '@/db/schema';
import { tarifTerendah } from '@/lib/vehicle-rate';

export type CatalogSort = 'harga-asc' | 'harga-desc' | 'nama-asc';

export type CatalogFilters = {
  q?: string;
  category?: string;
  maxPrice?: number;
  sort?: CatalogSort;
};

const URUTAN_VALID: CatalogSort[] = ['harga-asc', 'harga-desc', 'nama-asc'];

export function parseCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const ambil = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const filters: CatalogFilters = {};

  const q = ambil('q')?.trim();
  if (q) filters.q = q;

  const category = ambil('category')?.trim();
  if (category) filters.category = category;

  const maxPrice = Number(ambil('maxPrice'));
  if (Number.isFinite(maxPrice) && maxPrice > 0) filters.maxPrice = maxPrice;

  const sort = ambil('sort') as CatalogSort | undefined;
  if (sort && URUTAN_VALID.includes(sort)) filters.sort = sort;

  return filters;
}

/**
 * Difilter di memori terhadap hasil query, bukan lewat klausa SQL dinamis.
 * Katalog LIANS berisi puluhan kendaraan, bukan puluhan ribu — menyusun SQL
 * dinamis untuk itu menambah rumit tanpa menambah cepat.
 */
export function filterAndSortVehicles(vehicles: Vehicle[], filters: CatalogFilters): Vehicle[] {
  const q = filters.q?.toLowerCase();

  const hasil = vehicles.filter((v) => {
    if (q && !v.name.toLowerCase().includes(q) && !v.category.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.category && v.category !== filters.category) return false;
    if (filters.maxPrice !== undefined) {
      const tarif = tarifTerendah(v);
      if (tarif === null || tarif > filters.maxPrice) return false;
    }
    return true;
  });

  // Kendaraan tanpa tarif sama sekali didorong ke belakang, bukan dianggap gratis.
  const urut = (a: Vehicle, b: Vehicle) =>
    (tarifTerendah(a) ?? Infinity) - (tarifTerendah(b) ?? Infinity);

  switch (filters.sort) {
    case 'harga-asc':
      return [...hasil].sort(urut);
    case 'harga-desc':
      return [...hasil].sort((a, b) => urut(b, a));
    case 'nama-asc':
      return [...hasil].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    default:
      return hasil;
  }
}
