import { describe, it, expect } from 'vitest';
import { countRentalDays, formatTanggalID } from '@/lib/dates';

describe('countRentalDays', () => {
  it('menghitung 1 Agustus sampai 3 Agustus sebagai 2 hari', () => {
    expect(countRentalDays(new Date('2026-08-01'), new Date('2026-08-03'))).toBe(2);
  });

  it('menghitung tanggal yang sama sebagai 1 hari', () => {
    expect(countRentalDays(new Date('2026-08-01'), new Date('2026-08-01'))).toBe(1);
  });

  it('mengembalikan minimum 1 walau tanggal selesai lebih awal', () => {
    expect(countRentalDays(new Date('2026-08-05'), new Date('2026-08-01'))).toBe(1);
  });

  it('mengabaikan jam pada tanggal', () => {
    expect(
      countRentalDays(new Date('2026-08-01T23:00:00'), new Date('2026-08-02T01:00:00')),
    ).toBe(1);
  });
});

describe('formatTanggalID', () => {
  it('memformat dalam bahasa Indonesia', () => {
    expect(formatTanggalID(new Date('2026-08-10'))).toBe('10 Agustus 2026');
  });
});
