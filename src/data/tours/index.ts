import type { TourPackage } from './types';
import { openTrip6Spot } from './open-trip-6-spot';
import { sunsetManado } from './sunset-manado';
import { oneDayBunaken } from './one-day-bunaken';
import { oneDayNainSiladenBunaken } from './one-day-nain-siladen-bunaken';
import { oneDayLihaga } from './one-day-lihaga';
import { oneDayMinahasaHighland } from './one-day-minahasa-highland';
import { bunakenMinahasa2h1m } from './2h1m-bunaken-minahasa';
import { bunakenNainSiladen2h1m } from './2h1m-bunaken-nain-siladen';
import { minahasaTigaPulau3h2m } from './3h2m-minahasa-tiga-pulau';
import { kekLikupang3h2m } from './3h2m-kek-likupang';
import { bunakenLikupangMinahasa4h3m } from './4h3m-bunaken-likupang-minahasa';
import { likupangLihagaBunakenMinahasa5h4m } from './5h4m-likupang-lihaga-bunaken-minahasa';

/**
 * Paket disusun manual, bukan dipindai dari folder: impor eksplisit membuat
 * paket yang belum siap tayang cukup dikeluarkan dari daftar ini tanpa
 * menghapus berkasnya, dan urutan tampil ditentukan `sortOrder`.
 */
export const TOUR_PACKAGES: TourPackage[] = [
  openTrip6Spot,
  sunsetManado,
  oneDayBunaken,
  oneDayNainSiladenBunaken,
  oneDayLihaga,
  oneDayMinahasaHighland,
  bunakenMinahasa2h1m,
  bunakenNainSiladen2h1m,
  minahasaTigaPulau3h2m,
  kekLikupang3h2m,
  bunakenLikupangMinahasa4h3m,
  likupangLihagaBunakenMinahasa5h4m,
].sort((a, b) => a.sortOrder - b.sortOrder);

export const TOUR_SLUGS: string[] = TOUR_PACKAGES.map((p) => p.slug);

export function getTourBySlug(slug: string): TourPackage | null {
  return TOUR_PACKAGES.find((p) => p.slug === slug) ?? null;
}

export type { TourPackage, TourDay, TourStep, TourCategory } from './types';
