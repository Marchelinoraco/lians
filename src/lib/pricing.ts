import { differenceInCalendarDays } from 'date-fns';
import { countRentalDays } from '@/lib/dates';

export type RateCategory = 'lepas-kunci' | 'pelayanan';

export type VehiclePricing = {
  rateLepasKunci: number | null;
  ratePelayanan: number | null;
};

export type RentalPriceInput = {
  vehicle: VehiclePricing;
  startDate: Date;
  endDate: Date;
  category: RateCategory;
};

export type PriceBreakdown = {
  days: number;
  category: RateCategory;
  ratePerDay: number;
  total: number;
};

export type PricingError = 'CATEGORY_UNAVAILABLE' | 'END_BEFORE_START';

export type PricingResult =
  | { ok: true; breakdown: PriceBreakdown }
  | { ok: false; error: PricingError };

export function tarifKategori(vehicle: VehiclePricing, category: RateCategory): number | null {
  return category === 'pelayanan' ? vehicle.ratePelayanan : vehicle.rateLepasKunci;
}

export function calculateRentalPrice(input: RentalPriceInput): PricingResult {
  const { vehicle, startDate, endDate, category } = input;

  // Diperiksa terpisah dari countRentalDays: fungsi itu menjaga minimum 1,
  // sehingga tanggal terbalik akan diam-diam menjadi sewa satu hari.
  if (differenceInCalendarDays(endDate, startDate) < 0) {
    return { ok: false, error: 'END_BEFORE_START' };
  }

  const ratePerDay = tarifKategori(vehicle, category);
  if (ratePerDay === null) return { ok: false, error: 'CATEGORY_UNAVAILABLE' };

  const days = countRentalDays(startDate, endDate);

  return { ok: true, breakdown: { days, category, ratePerDay, total: days * ratePerDay } };
}

/** Tarif travel bersifat tetap sekali jalan — tidak dikali hari. */
export function calculateTravelPrice(routePrice: number | null): number | null {
  return routePrice;
}
