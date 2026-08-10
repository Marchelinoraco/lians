import { describe, it, expect } from 'vitest';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import type { VehiclePricing } from '@/lib/pricing';

const innova: VehiclePricing = { rate24h: 700000, rate12h: 500000, driverFeeOverride: null };
const brio: VehiclePricing = { rate24h: 350000, rate12h: null, driverFeeOverride: null };

describe('calculateRentalPrice', () => {
  it('sewa 5 hari dengan sopir 3 hari', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-06'),
      rateType: '24h',
      driverDays: 3,
      driverFeePerDay: 150000,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(5);
    expect(hasil.breakdown.rentalCost).toBe(3500000);
    expect(hasil.breakdown.driverCost).toBe(450000);
    expect(hasil.breakdown.total).toBe(3950000);
  });

  it('paket 12 jam dihitung per hari kalender dengan tarif berbeda', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-04'),
      rateType: '12h',
      driverDays: 0,
      driverFeePerDay: 150000,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(3);
    expect(hasil.breakdown.total).toBe(1500000);
  });

  it('menolak paket 12 jam pada mobil tanpa tarif 12 jam', () => {
    const hasil = calculateRentalPrice({
      vehicle: brio,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-02'),
      rateType: '12h',
      driverDays: 0,
      driverFeePerDay: 150000,
    });

    expect(hasil).toEqual({ ok: false, error: 'RATE_12H_UNAVAILABLE' });
  });

  it('menolak hari sopir melebihi durasi sewa', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-03'),
      rateType: '24h',
      driverDays: 5,
      driverFeePerDay: 150000,
    });

    expect(hasil).toEqual({ ok: false, error: 'DRIVER_DAYS_EXCEEDS_DURATION' });
  });

  it('menolak hari sopir negatif', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-03'),
      rateType: '24h',
      driverDays: -1,
      driverFeePerDay: 150000,
    });

    expect(hasil).toEqual({ ok: false, error: 'DRIVER_DAYS_NEGATIVE' });
  });

  it('memakai driverFeeOverride bila kendaraan punya tarif sopir sendiri', () => {
    const hasil = calculateRentalPrice({
      vehicle: { rate24h: 1500000, rate12h: null, driverFeeOverride: 250000 },
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-02'),
      rateType: '24h',
      driverDays: 1,
      driverFeePerDay: 150000,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.driverCost).toBe(250000);
  });
});

describe('calculateTravelPrice', () => {
  it('mengembalikan tarif rute apa adanya', () => {
    expect(calculateTravelPrice(150000)).toBe(150000);
  });

  it('mengembalikan null bila rute belum bertarif', () => {
    expect(calculateTravelPrice(null)).toBeNull();
  });
});
