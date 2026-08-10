import { describe, it } from 'vitest';
import fc from 'fast-check';
import { addDays } from 'date-fns';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';

const rupiah = fc.integer({ min: 50_000, max: 5_000_000 });
const awal = new Date('2026-08-01');

const skenario = fc
  .record({
    rate24h: rupiah,
    rate12h: fc.option(rupiah, { nil: null }),
    durasi: fc.integer({ min: 1, max: 60 }),
    driverFeePerDay: rupiah,
    pakai12h: fc.boolean(),
  })
  .chain((r) =>
    fc.record({
      base: fc.constant(r),
      driverDays: fc.integer({ min: 0, max: r.durasi }),
    }),
  );

describe('properti harga sewa', () => {
  it('total tidak pernah negatif', () => {
    fc.assert(
      fc.property(skenario, ({ base, driverDays }) => {
        const hasil = calculateRentalPrice({
          vehicle: { rate24h: base.rate24h, rate12h: base.rate12h, driverFeeOverride: null },
          startDate: awal,
          endDate: addDays(awal, base.durasi),
          rateType: base.pakai12h && base.rate12h !== null ? '12h' : '24h',
          driverDays,
          driverFeePerDay: base.driverFeePerDay,
        });
        if (!hasil.ok) return true;
        return hasil.breakdown.total >= 0;
      }),
    );
  });

  it('total selalu sama dengan jumlah komponen rinciannya', () => {
    fc.assert(
      fc.property(skenario, ({ base, driverDays }) => {
        const hasil = calculateRentalPrice({
          vehicle: { rate24h: base.rate24h, rate12h: base.rate12h, driverFeeOverride: null },
          startDate: awal,
          endDate: addDays(awal, base.durasi),
          rateType: base.pakai12h && base.rate12h !== null ? '12h' : '24h',
          driverDays,
          driverFeePerDay: base.driverFeePerDay,
        });
        if (!hasil.ok) return true;
        const b = hasil.breakdown;
        return b.total === b.rentalCost + b.driverCost;
      }),
    );
  });

  it('menambah durasi tidak pernah menurunkan total', () => {
    fc.assert(
      fc.property(rupiah, rupiah, fc.integer({ min: 1, max: 30 }), (rate24h, fee, durasi) => {
        const buat = (d: number) =>
          calculateRentalPrice({
            vehicle: { rate24h, rate12h: null, driverFeeOverride: null },
            startDate: awal,
            endDate: addDays(awal, d),
            rateType: '24h',
            driverDays: 0,
            driverFeePerDay: fee,
          });
        const pendek = buat(durasi);
        const panjang = buat(durasi + 1);
        if (!pendek.ok || !panjang.ok) return false;
        return panjang.breakdown.total >= pendek.breakdown.total;
      }),
    );
  });

  it('hari sopir melebihi durasi selalu ditolak', () => {
    fc.assert(
      fc.property(
        rupiah,
        rupiah,
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 30 }),
        (rate24h, fee, durasi, kelebihan) => {
          const hasil = calculateRentalPrice({
            vehicle: { rate24h, rate12h: null, driverFeeOverride: null },
            startDate: awal,
            endDate: addDays(awal, durasi),
            rateType: '24h',
            driverDays: durasi + kelebihan,
            driverFeePerDay: fee,
          });
          return !hasil.ok && hasil.error === 'DRIVER_DAYS_EXCEEDS_DURATION';
        },
      ),
    );
  });

  it('paket 12 jam pada mobil tanpa tarif 12 jam selalu ditolak', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 1, max: 30 }), (rate24h, durasi) => {
        const hasil = calculateRentalPrice({
          vehicle: { rate24h, rate12h: null, driverFeeOverride: null },
          startDate: awal,
          endDate: addDays(awal, durasi),
          rateType: '12h',
          driverDays: 0,
          driverFeePerDay: 150000,
        });
        return !hasil.ok && hasil.error === 'RATE_12H_UNAVAILABLE';
      }),
    );
  });

  it('harga travel tidak terpengaruh tanggal maupun durasi', () => {
    fc.assert(
      fc.property(fc.option(rupiah, { nil: null }), (harga) => {
        return calculateTravelPrice(harga) === harga;
      }),
    );
  });
});
