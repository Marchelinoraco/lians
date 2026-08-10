import { describe, it, expect } from 'vitest';
import { slugUnik } from '@/lib/slug';

describe('slugUnik', () => {
  it('memakai slug dasar bila belum terpakai', () => {
    expect(slugUnik('Innova Zenix G', [])).toBe('innova-zenix-g');
  });

  it('menambahkan angka bila slug sudah terpakai', () => {
    expect(slugUnik('Innova Zenix G', ['innova-zenix-g'])).toBe('innova-zenix-g-2');
  });

  it('terus menaikkan angka sampai menemukan yang bebas', () => {
    expect(slugUnik('Avanza', ['avanza', 'avanza-2', 'avanza-3'])).toBe('avanza-4');
  });

  it('memberi slug cadangan untuk nama tanpa huruf', () => {
    expect(slugUnik('###', [])).toMatch(/^kendaraan-/);
  });

  it('slug cadangan tetap unik bila kebetulan sudah terpakai', () => {
    const hasil = slugUnik('###', []);
    expect(slugUnik('###', [hasil])).not.toBe(hasil);
  });
});
