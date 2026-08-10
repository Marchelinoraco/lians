import { describe, it, expect } from 'vitest';
import { pickLocale, toLocalized } from '@/i18n/localized';

describe('pickLocale', () => {
  const fitur = { id: ['AC Dingin'], en: ['Cold AC'], ko: ['시원한 에어컨'] };

  it('mengambil bahasa yang diminta bila tersedia', () => {
    expect(pickLocale(fitur, 'en')).toEqual(['Cold AC']);
    expect(pickLocale(fitur, 'ko')).toEqual(['시원한 에어컨']);
  });

  it('jatuh ke bahasa Indonesia bila terjemahan belum diisi', () => {
    expect(pickLocale(fitur, 'zh')).toEqual(['AC Dingin']);
  });

  it('jatuh ke bahasa Indonesia bila terjemahan berupa string kosong', () => {
    expect(pickLocale({ id: 'Halo', en: '' }, 'en')).toBe('Halo');
  });

  it('jatuh ke bahasa Indonesia bila terjemahan berupa array kosong', () => {
    expect(pickLocale({ id: ['A'], en: [] }, 'en')).toEqual(['A']);
  });

  it('mengembalikan null untuk nilai yang tidak ada', () => {
    expect(pickLocale(null, 'en')).toBeNull();
    expect(pickLocale(undefined, 'id')).toBeNull();
  });
});

describe('toLocalized', () => {
  it('membungkus nilai tunggal sebagai bahasa Indonesia', () => {
    expect(toLocalized('Halo')).toEqual({ id: 'Halo' });
  });
});
