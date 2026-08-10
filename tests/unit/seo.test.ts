import { describe, it, expect } from 'vitest';
import { buildAutoRentalJsonLd, buildVehicleJsonLd, buildAlternates, SITE_URL } from '@/lib/seo';
import { DEFAULT_SETTINGS } from '@/queries/settings';

describe('buildAutoRentalJsonLd', () => {
  const jsonLd = buildAutoRentalJsonLd({
    settings: DEFAULT_SETTINGS,
    priceRange: 'Rp 350.000 - Rp 2.500.000',
    url: 'https://lians.id',
    locale: 'id',
  }) as Record<string, unknown>;

  it('memakai tipe AutoRental', () => {
    expect(jsonLd['@type']).toBe('AutoRental');
  });

  it('menyertakan alamat Manado yang lengkap', () => {
    const alamat = jsonLd.address as Record<string, string>;
    expect(alamat.addressLocality).toBe('Manado');
    expect(alamat.postalCode).toBe('95125');
    expect(alamat.streetAddress).toContain('Pomorow');
  });

  it('menyertakan nama bisnis LIANS', () => {
    expect(jsonLd.name).toBe('LIANS');
  });

  it('memakai deskripsi dan jam operasional sesuai bahasa', () => {
    const ko = buildAutoRentalJsonLd({
      settings: DEFAULT_SETTINGS,
      priceRange: '-',
      url: 'https://lians.id/ko',
      locale: 'ko',
    }) as Record<string, unknown>;
    expect(String(ko.openingHours)).toContain('매일');
  });
});

// SITE_URL berbeda antara lokal dan produksi, jadi yang diuji strukturnya —
// bukan domainnya, yang urusan konfigurasi saat deploy.
describe('buildAlternates', () => {
  const alt = buildAlternates('/mobil/innova-zenix-g', 'en');

  it('menjadikan versi bahasa aktif sebagai canonical', () => {
    expect(alt.canonical).toBe(`${SITE_URL}/en/mobil/innova-zenix-g`);
  });

  it('mendaftarkan keempat bahasa', () => {
    expect(alt.languages['id-ID']).toBe(`${SITE_URL}/mobil/innova-zenix-g`);
    expect(alt.languages['en']).toBe(`${SITE_URL}/en/mobil/innova-zenix-g`);
    expect(alt.languages['zh-CN']).toBe(`${SITE_URL}/zh/mobil/innova-zenix-g`);
    expect(alt.languages['ko-KR']).toBe(`${SITE_URL}/ko/mobil/innova-zenix-g`);
  });

  it('menunjuk x-default ke versi Indonesia, bukan ke bahasa aktif', () => {
    expect(alt.languages['x-default']).toBe(`${SITE_URL}/mobil/innova-zenix-g`);
    expect(alt.languages['x-default']).not.toBe(alt.canonical);
  });

  it('tidak memberi awalan pada URL bahasa Indonesia', () => {
    expect(buildAlternates('/', 'id').canonical).toBe(`${SITE_URL}/`);
  });

  it('mendaftarkan lima entri: empat bahasa plus x-default', () => {
    expect(Object.keys(alt.languages)).toHaveLength(5);
  });
});

describe('buildVehicleJsonLd', () => {
  it('menyusun penawaran dengan mata uang IDR', () => {
    const jsonLd = buildVehicleJsonLd({
      vehicle: { name: 'Innova Zenix G', rate24h: 900000, status: 'available' } as never,
      url: 'https://lians.id/mobil/innova-zenix-g',
    }) as Record<string, unknown>;
    const offer = jsonLd.offers as Record<string, unknown>;
    expect(offer.priceCurrency).toBe('IDR');
    expect(offer.price).toBe(900000);
    expect(offer.availability).toBe('https://schema.org/InStock');
  });

  it('menandai kendaraan yang sedang tersewa sebagai stok habis', () => {
    const jsonLd = buildVehicleJsonLd({
      vehicle: { name: 'Alphard', rate24h: 2500000, status: 'unavailable' } as never,
      url: 'https://lians.id/mobil/alphard',
    }) as Record<string, unknown>;
    expect((jsonLd.offers as Record<string, string>).availability).toBe(
      'https://schema.org/OutOfStock',
    );
  });
});
