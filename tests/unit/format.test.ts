import { describe, it, expect } from 'vitest';
import { formatRupiah, formatRupiahBertanda } from '@/lib/format';

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

describe('formatRupiahBertanda', () => {
  it('menulis angka positif seperti biasa', () => {
    expect(formatRupiahBertanda(950000)).toBe('Rp 950.000');
  });

  // "Rp -300.000" membuat tanda minusnya terselip di tengah dan mudah terlewat
  // saat membaca cepat. Yang dibaca lebih dulu harus tandanya, bukan mata uangnya.
  it('menaruh tanda minus di depan, bukan di antara Rp dan angkanya', () => {
    expect(formatRupiahBertanda(-300000)).toBe('-Rp 300.000');
  });
});
