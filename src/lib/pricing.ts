import { countRentalDays } from '@/lib/dates';

export type RateType = '24h' | '12h';

export type VehiclePricing = {
  rate24h: number;
  rate12h: number | null;
  driverFeeOverride: number | null;
};

export type RentalPriceInput = {
  vehicle: VehiclePricing;
  startDate: Date;
  endDate: Date;
  rateType: RateType;
  driverDays: number;
  driverFeePerDay: number;
};

export type PriceBreakdown = {
  days: number;
  ratePerDay: number;
  rentalCost: number;
  driverDays: number;
  driverFeePerDay: number;
  driverCost: number;
  total: number;
};

export type PricingError =
  | 'RATE_12H_UNAVAILABLE'
  | 'DRIVER_DAYS_EXCEEDS_DURATION'
  | 'DRIVER_DAYS_NEGATIVE';

export type PricingResult =
  | { ok: true; breakdown: PriceBreakdown }
  | { ok: false; error: PricingError };

export function calculateRentalPrice(input: RentalPriceInput): PricingResult {
  const { vehicle, startDate, endDate, rateType, driverDays, driverFeePerDay } = input;

  if (rateType === '12h' && vehicle.rate12h === null) {
    return { ok: false, error: 'RATE_12H_UNAVAILABLE' };
  }
  if (driverDays < 0) {
    return { ok: false, error: 'DRIVER_DAYS_NEGATIVE' };
  }

  const days = countRentalDays(startDate, endDate);
  if (driverDays > days) {
    return { ok: false, error: 'DRIVER_DAYS_EXCEEDS_DURATION' };
  }

  const ratePerDay = rateType === '12h' ? (vehicle.rate12h as number) : vehicle.rate24h;
  const effectiveDriverFee = vehicle.driverFeeOverride ?? driverFeePerDay;

  const rentalCost = days * ratePerDay;
  const driverCost = driverDays * effectiveDriverFee;

  return {
    ok: true,
    breakdown: {
      days,
      ratePerDay,
      rentalCost,
      driverDays,
      driverFeePerDay: effectiveDriverFee,
      driverCost,
      total: rentalCost + driverCost,
    },
  };
}

/** Tarif travel bersifat tetap sekali jalan — tidak dikali hari, tidak kena biaya sopir. */
export function calculateTravelPrice(routePrice: number | null): number | null {
  return routePrice;
}
