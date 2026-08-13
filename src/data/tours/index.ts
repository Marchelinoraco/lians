import type { TourPackage } from './types';
import { openTrip6Spot } from './open-trip-6-spot';

/**
 * Paket disusun manual, bukan dipindai dari folder: impor eksplisit membuat
 * paket yang belum siap tayang cukup dikeluarkan dari daftar ini tanpa
 * menghapus berkasnya, dan urutan tampil ditentukan `sortOrder`.
 */
export const TOUR_PACKAGES: TourPackage[] = [openTrip6Spot].sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

export const TOUR_SLUGS: string[] = TOUR_PACKAGES.map((p) => p.slug);

export function getTourBySlug(slug: string): TourPackage | null {
  return TOUR_PACKAGES.find((p) => p.slug === slug) ?? null;
}

export type { TourPackage, TourDay, TourStep, TourCategory } from './types';
