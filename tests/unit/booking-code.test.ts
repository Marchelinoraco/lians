import { describe, it, expect } from 'vitest';
import { generateBookingCode } from '@/lib/booking-code';

describe('generateBookingCode', () => {
  it('memakai format LNS-YYYYMMDD-XXXX', () => {
    const code = generateBookingCode(new Date('2026-08-10T09:00:00'));
    expect(code).toMatch(/^LNS-20260810-[A-Z2-9]{4}$/);
  });

  it('tidak memakai karakter yang mudah tertukar saat dibacakan', () => {
    for (let i = 0; i < 200; i += 1) {
      const suffix = generateBookingCode(new Date('2026-08-10')).split('-')[2];
      expect(suffix).not.toMatch(/[OIL01]/);
    }
  });

  it('menghasilkan kode berbeda pada tanggal yang sama', () => {
    const codes = new Set(
      Array.from({ length: 50 }, () => generateBookingCode(new Date('2026-08-10'))),
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});
