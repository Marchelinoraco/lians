import { describe, it, expect } from 'vitest';
import { splitLocalePath, localeHref, toAppPath } from '@/i18n/locale-path';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';
import { getMessages } from '@/i18n';

describe('splitLocalePath', () => {
  it('membaca path tanpa awalan sebagai bahasa Indonesia', () => {
    expect(splitLocalePath('/mobil')).toEqual({ locale: 'id', rest: '/mobil' });
  });

  it('membaca awalan /en', () => {
    expect(splitLocalePath('/en/mobil')).toEqual({ locale: 'en', rest: '/mobil' });
  });

  it('membaca awalan /zh dan /ko', () => {
    expect(splitLocalePath('/zh/travel')).toEqual({ locale: 'zh', rest: '/travel' });
    expect(splitLocalePath('/ko/booking')).toEqual({ locale: 'ko', rest: '/booking' });
  });

  it('mengembalikan / untuk awalan bahasa tanpa sisa path', () => {
    expect(splitLocalePath('/en')).toEqual({ locale: 'en', rest: '/' });
    expect(splitLocalePath('/en/')).toEqual({ locale: 'en', rest: '/' });
  });

  it('memperlakukan segmen yang mirip bahasa tapi bukan sebagai path biasa', () => {
    expect(splitLocalePath('/id/mobil')).toEqual({ locale: 'id', rest: '/id/mobil' });
    expect(splitLocalePath('/enak')).toEqual({ locale: 'id', rest: '/enak' });
  });

  it('memperlakukan akar sebagai Indonesia', () => {
    expect(splitLocalePath('/')).toEqual({ locale: 'id', rest: '/' });
  });
});

describe('localeHref', () => {
  it('tidak memberi awalan pada bahasa bawaan', () => {
    expect(localeHref('/mobil', 'id')).toBe('/mobil');
    expect(localeHref('/', 'id')).toBe('/');
  });

  it('memberi awalan pada bahasa lain', () => {
    expect(localeHref('/mobil', 'en')).toBe('/en/mobil');
    expect(localeHref('/', 'ko')).toBe('/ko');
  });

  it('bolak-balik dengan splitLocalePath tanpa berubah', () => {
    for (const locale of LOCALES) {
      for (const path of ['/', '/mobil', '/mobil/innova-zenix-g', '/travel']) {
        expect(splitLocalePath(localeHref(path, locale))).toEqual({ locale, rest: path });
      }
    }
  });
});

describe('toAppPath', () => {
  it('memberi awalan bahasa Indonesia pada path tanpa awalan', () => {
    expect(toAppPath('/mobil')).toBe('/id/mobil');
    expect(toAppPath('/')).toBe('/id');
  });

  it('membiarkan path yang sudah berawalan bahasa lain', () => {
    expect(toAppPath('/en/mobil')).toBe('/en/mobil');
    expect(toAppPath('/ko')).toBe('/ko');
  });
});

describe('kamus pesan', () => {
  it('menyediakan kamus untuk setiap bahasa', () => {
    for (const locale of LOCALES) {
      expect(getMessages(locale).nav.vehicles).toBeTruthy();
    }
  });

  it('setiap bahasa punya kunci yang sama persis dengan bahasa bawaan', () => {
    const kunciBawaan = Object.keys(getMessages(DEFAULT_LOCALE)).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(getMessages(locale)).sort()).toEqual(kunciBawaan);
    }
  });

  // Satu layanan, satu sebutan — di bilah atas maupun di kartu beranda, dalam
  // bahasa apa pun. Sebutan yang berbeda-beda membuat pengunjung mengira
  // keduanya menuju dua layanan yang berlainan.
  //
  // Diperiksa sebagai aturan untuk seluruh bahasa, bukan satu per satu:
  // ketidakseragaman ini sudah muncul tiga kali di bahasa yang berbeda, dan
  // memeriksanya satu per satu berarti bahasa berikutnya kembali terlewat.
  it('memakai sebutan yang sama antara menu dan kartu layanan di semua bahasa', () => {
    for (const locale of LOCALES) {
      const t = getMessages(locale);
      expect([t.nav.vehicles, t.nav.ticketing, t.nav.tours]).toEqual([
        t.home.serviceRental,
        t.home.serviceFlight,
        t.home.serviceTour,
      ]);
    }
  });

  it('menerjemahkan label navigasi ke bahasa masing-masing', () => {
    expect(getMessages('id').nav.vehicles).toBe('Rental Mobil');
    expect(getMessages('id').nav.tours).toBe('Paket Tour');
    expect(getMessages('id').nav.ticketing).toBe('Tiket Pesawat');
    expect(getMessages('en').nav.vehicles).toBe('Car Rental');
    expect(getMessages('en').nav.ticketing).toBe('Ticketing');
    expect(getMessages('zh').nav.vehicles).toBe('租车');
    expect(getMessages('ko').nav.vehicles).toBe('렌터카');
  });
});
