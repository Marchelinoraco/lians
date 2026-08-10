import { describe, it, expect } from 'vitest';
import { countRentalDays, formatTanggal } from '@/lib/dates';

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

describe('formatTanggal', () => {
  it('memformat dalam bahasa Indonesia', () => {
    expect(formatTanggal(new Date('2026-08-10'), 'id')).toBe('10 Agustus 2026');
  });

  it('memformat dalam bahasa Inggris', () => {
    expect(formatTanggal(new Date('2026-08-10'), 'en')).toBe('10 August 2026');
  });

  it('memakai urutan tahun-bulan-hari untuk Mandarin dan Korea', () => {
    expect(formatTanggal(new Date('2026-08-10'), 'zh')).toBe('2026年8月10日');
    expect(formatTanggal(new Date('2026-08-10'), 'ko')).toBe('2026년 8월 10일');
  });
});
