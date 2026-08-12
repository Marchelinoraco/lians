import { describe, it, expect } from 'vitest';
import { tarifTerendah } from '@/lib/vehicle-rate';

describe('tarifTerendah', () => {
  it('mengambil yang paling murah dari dua tarif', () => {
    expect(tarifTerendah({ rateLepasKunci: 900000, ratePelayanan: 1300000 })).toBe(900000);
  });

  it('memakai tarif pelayanan bila lepas kunci tidak tersedia', () => {
    expect(tarifTerendah({ rateLepasKunci: null, ratePelayanan: 1500000 })).toBe(1500000);
  });

  it('memakai tarif lepas kunci bila pelayanan tidak tersedia', () => {
    expect(tarifTerendah({ rateLepasKunci: 350000, ratePelayanan: null })).toBe(350000);
  });

  it('mengembalikan null bila keduanya kosong', () => {
    expect(tarifTerendah({ rateLepasKunci: null, ratePelayanan: null })).toBeNull();
  });
});
