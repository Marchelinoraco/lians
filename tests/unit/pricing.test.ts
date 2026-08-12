import { describe, it, expect } from 'vitest';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import type { VehiclePricing } from '@/lib/pricing';

const innova: VehiclePricing = { rateLepasKunci: 700000, ratePelayanan: 1000000 };
const bus: VehiclePricing = { rateLepasKunci: null, ratePelayanan: 1500000 };

describe('calculateRentalPrice', () => {
  it('menghitung 15 sampai 17 Agustus sebagai 3 hari lepas kunci', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-17'),
      category: 'lepas-kunci',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(3);
    expect(hasil.breakdown.ratePerDay).toBe(700000);
    expect(hasil.breakdown.total).toBe(2100000);
  });

  it('memakai tarif pelayanan bila kategori itu dipilih', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-17'),
      category: 'pelayanan',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.total).toBe(3000000);
    expect(hasil.breakdown.category).toBe('pelayanan');
  });

  it('menghitung sewa satu hari untuk tanggal mulai dan selesai yang sama', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-15'),
      category: 'lepas-kunci',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(1);
    expect(hasil.breakdown.total).toBe(700000);
  });

  it('menolak kategori yang tidak disediakan kendaraan', () => {
    const hasil = calculateRentalPrice({
      vehicle: bus,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-17'),
      category: 'lepas-kunci',
    });

    expect(hasil).toEqual({ ok: false, error: 'CATEGORY_UNAVAILABLE' });
  });

  it('menolak tanggal selesai sebelum tanggal mulai', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-17'),
      endDate: new Date('2026-08-15'),
      category: 'lepas-kunci',
    });

    expect(hasil).toEqual({ ok: false, error: 'END_BEFORE_START' });
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
