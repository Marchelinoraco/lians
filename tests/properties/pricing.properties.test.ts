import { describe, it } from 'vitest';
import fc from 'fast-check';
import { addDays } from 'date-fns';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import type { RateCategory } from '@/lib/pricing';

const rupiah = fc.integer({ min: 50_000, max: 5_000_000 });
const awal = new Date('2026-08-01');
const kategori = fc.constantFrom<RateCategory>('lepas-kunci', 'pelayanan');

describe('properti harga sewa', () => {
  it('total tidak pernah negatif', () => {
    fc.assert(
      fc.property(rupiah, rupiah, fc.integer({ min: 0, max: 60 }), kategori, (a, b, n, k) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: a, ratePelayanan: b },
          startDate: awal,
          endDate: addDays(awal, n),
          category: k,
        });
        return !hasil.ok || hasil.breakdown.total >= 0;
      }),
    );
  });

  it('total selalu sama dengan hari dikali tarif', () => {
    fc.assert(
      fc.property(rupiah, rupiah, fc.integer({ min: 0, max: 60 }), kategori, (a, b, n, k) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: a, ratePelayanan: b },
          startDate: awal,
          endDate: addDays(awal, n),
          category: k,
        });
        if (!hasil.ok) return true;
        const d = hasil.breakdown;
        return d.total === d.days * d.ratePerDay;
      }),
    );
  });

  it('menambah durasi tidak pernah menurunkan total', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 0, max: 30 }), (tarif, n) => {
        const buat = (d: number) =>
          calculateRentalPrice({
            vehicle: { rateLepasKunci: tarif, ratePelayanan: tarif },
            startDate: awal,
            endDate: addDays(awal, d),
            category: 'lepas-kunci',
          });
        const pendek = buat(n);
        const panjang = buat(n + 1);
        if (!pendek.ok || !panjang.ok) return false;
        return panjang.breakdown.total >= pendek.breakdown.total;
      }),
    );
  });

  it('sewa tanggal yang sama selalu dihitung satu hari', () => {
    fc.assert(
      fc.property(rupiah, kategori, (tarif, k) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: tarif, ratePelayanan: tarif },
          startDate: awal,
          endDate: awal,
          category: k,
        });
        return hasil.ok && hasil.breakdown.days === 1 && hasil.breakdown.total === tarif;
      }),
    );
  });

  it('kategori tanpa tarif selalu ditolak', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 0, max: 30 }), (tarif, n) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: null, ratePelayanan: tarif },
          startDate: awal,
          endDate: addDays(awal, n),
          category: 'lepas-kunci',
        });
        return !hasil.ok && hasil.error === 'CATEGORY_UNAVAILABLE';
      }),
    );
  });

  it('tanggal selesai sebelum tanggal mulai selalu ditolak', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 1, max: 30 }), (tarif, n) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: tarif, ratePelayanan: tarif },
          startDate: addDays(awal, n),
          endDate: awal,
          category: 'lepas-kunci',
        });
        return !hasil.ok && hasil.error === 'END_BEFORE_START';
      }),
    );
  });

  it('harga travel tidak terpengaruh tanggal maupun durasi', () => {
    fc.assert(
      fc.property(fc.option(rupiah, { nil: null }), (harga) => calculateTravelPrice(harga) === harga),
    );
  });
});
