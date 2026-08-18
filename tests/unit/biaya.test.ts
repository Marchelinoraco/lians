import { describe, it, expect } from 'vitest';
import { hitungBiayaOperasional, hitungMargin } from '@/lib/biaya';

const kosong = {
  costFuel: null,
  costDriver: null,
  costTollParking: null,
  costOther: null,
};

describe('hitungBiayaOperasional', () => {
  it('menjumlahkan keempat pos biaya', () => {
    expect(
      hitungBiayaOperasional({
        costFuel: 300000,
        costDriver: 250000,
        costTollParking: 75000,
        costOther: 25000,
      }),
    ).toBe(650000);
  });

  it('memperlakukan pos yang belum diisi sebagai nol', () => {
    expect(hitungBiayaOperasional({ ...kosong, costFuel: 300000 })).toBe(300000);
  });

  it('menghasilkan nol bila belum satu pos pun diisi', () => {
    expect(hitungBiayaOperasional(kosong)).toBe(0);
  });
});

describe('hitungMargin', () => {
  it('mengurangi biaya pemasok dan biaya operasional dari harga pelanggan', () => {
    expect(
      hitungMargin({
        totalPrice: 3600000,
        supplierCost: 2000000,
        costFuel: 400000,
        costDriver: 250000,
        costTollParking: null,
        costOther: null,
      }),
    ).toBe(950000);
  });

  it('tetap mengurangi biaya operasional pada kendaraan milik LIANS sendiri', () => {
    expect(
      hitungMargin({ ...kosong, totalPrice: 1000000, supplierCost: null, costFuel: 300000 }),
    ).toBe(700000);
  });

  it('menghasilkan angka minus bila biaya melampaui harga pelanggan', () => {
    expect(
      hitungMargin({ ...kosong, totalPrice: 500000, supplierCost: 400000, costFuel: 300000 }),
    ).toBe(-200000);
  });

  // Rute travel tanpa tarif tetap disimpan tanpa harga. Mengembalikan 0 di sini
  // akan tampil sebagai "Rp 0" — seolah pesanan itu benar-benar tidak untung,
  // padahal angkanya memang belum ada.
  it('menghasilkan null bila harga ke pelanggan belum ditentukan', () => {
    expect(hitungMargin({ ...kosong, totalPrice: null, supplierCost: null })).toBeNull();
  });
});
