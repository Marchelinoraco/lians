import { describe, it, expect } from 'vitest';
import { formatRupiah } from '@/lib/format';

describe('formatRupiah', () => {
  it('memformat ribuan dengan pemisah titik', () => {
    expect(formatRupiah(350000)).toBe('Rp 350.000');
  });

  it('memformat jutaan', () => {
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000');
  });

  it('memformat nol', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });
});
