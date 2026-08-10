import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/slug';

describe('slugify', () => {
  it('mengubah nama mobil jadi slug', () => {
    expect(slugify('Innova Zenix G')).toBe('innova-zenix-g');
  });

  it('membuang tanda baca', () => {
    expect(slugify('All New Brio (2024)')).toBe('all-new-brio-2024');
  });

  it('merapatkan spasi berlebih', () => {
    expect(slugify('  Hiace   Premio  ')).toBe('hiace-premio');
  });

  it('mengembalikan string kosong untuk masukan tanpa huruf', () => {
    expect(slugify('!!!')).toBe('');
  });
});
