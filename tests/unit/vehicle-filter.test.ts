import { describe, it, expect } from 'vitest';
import { filterAndSortVehicles, parseCatalogFilters } from '@/lib/vehicle-filter';
import type { Vehicle } from '@/db/schema';

const buat = (over: Partial<Vehicle>): Vehicle =>
  ({
    id: crypto.randomUUID(),
    slug: 'x',
    name: 'Mobil',
    category: 'mpv',
    images: [],
    rateLepasKunci: 500000,
    ratePelayanan: null,
    serviceTypes: ['self-drive'],
    seats: 7,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2023,
    luggage: 2,
    features: { id: [] },
    rentalTerms: { id: [] },
    status: 'available',
    isPublished: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Vehicle;

const armada = [
  buat({ name: 'All New Brio', category: 'hatchback', rateLepasKunci: 350000 }),
  buat({ name: 'Toyota Avanza', category: 'mpv', rateLepasKunci: 400000 }),
  buat({ name: 'Toyota Fortuner', category: 'suv', rateLepasKunci: 1200000 }),
];

describe('filterAndSortVehicles', () => {
  it('mengembalikan semua kendaraan bila tidak ada filter', () => {
    expect(filterAndSortVehicles(armada, {})).toHaveLength(3);
  });

  it('mencari berdasarkan nama tanpa peduli huruf besar-kecil', () => {
    const hasil = filterAndSortVehicles(armada, { q: 'brio' });
    expect(hasil.map((v) => v.name)).toEqual(['All New Brio']);
  });

  it('menyaring berdasarkan kategori', () => {
    const hasil = filterAndSortVehicles(armada, { category: 'suv' });
    expect(hasil.map((v) => v.name)).toEqual(['Toyota Fortuner']);
  });

  it('menyaring berdasarkan harga maksimum', () => {
    const hasil = filterAndSortVehicles(armada, { maxPrice: 450000 });
    expect(hasil).toHaveLength(2);
  });

  it('mengurutkan dari harga termurah', () => {
    const hasil = filterAndSortVehicles(armada, { sort: 'harga-asc' });
    expect(hasil.map((v) => v.rateLepasKunci)).toEqual([350000, 400000, 1200000]);
  });

  it('mengurutkan dari harga termahal', () => {
    const hasil = filterAndSortVehicles(armada, { sort: 'harga-desc' });
    expect(hasil.map((v) => v.rateLepasKunci)).toEqual([1200000, 400000, 350000]);
  });

  it('mengurutkan berdasarkan nama', () => {
    const hasil = filterAndSortVehicles(armada, { sort: 'nama-asc' });
    expect(hasil[0].name).toBe('All New Brio');
  });

  it('tidak mengubah array masukan', () => {
    const salinan = [...armada];
    filterAndSortVehicles(armada, { sort: 'harga-desc' });
    expect(armada).toEqual(salinan);
  });

  it('menggabungkan pencarian dan filter kategori', () => {
    const hasil = filterAndSortVehicles(armada, { q: 'toyota', category: 'mpv' });
    expect(hasil.map((v) => v.name)).toEqual(['Toyota Avanza']);
  });

  it('mengembalikan daftar kosong bila tidak ada yang cocok', () => {
    expect(filterAndSortVehicles(armada, { q: 'lamborghini' })).toEqual([]);
  });
});

describe('parseCatalogFilters', () => {
  it('membaca parameter URL menjadi filter', () => {
    expect(
      parseCatalogFilters({ q: 'brio', category: 'suv', maxPrice: '500000', sort: 'harga-asc' }),
    ).toEqual({ q: 'brio', category: 'suv', maxPrice: 500000, sort: 'harga-asc' });
  });

  it('mengabaikan harga maksimum yang bukan angka', () => {
    expect(parseCatalogFilters({ maxPrice: 'mahal' }).maxPrice).toBeUndefined();
  });

  it('mengabaikan urutan yang tidak dikenal', () => {
    expect(parseCatalogFilters({ sort: 'acak' }).sort).toBeUndefined();
  });

  it('mengabaikan pencarian yang hanya berisi spasi', () => {
    expect(parseCatalogFilters({ q: '   ' }).q).toBeUndefined();
  });

  it('mengambil nilai pertama bila parameter muncul berkali-kali', () => {
    expect(parseCatalogFilters({ category: ['suv', 'mpv'] }).category).toBe('suv');
  });
});
