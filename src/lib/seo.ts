import type { Vehicle } from '@/db/schema';
import type { SettingsInput } from '@/schemas/settings';
import {
  LOCALES,
  LOCALE_HTML_LANG,
  DEFAULT_LOCALE,
  localeHref,
  pickLocale,
  type Locale,
} from '@/i18n';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lians.id';

/**
 * hreflang untuk keempat bahasa plus x-default.
 * Tanpa ini Google bisa menyajikan halaman berbahasa Indonesia kepada orang
 * yang mencari dalam bahasa Korea.
 */
export function buildAlternates(path: string, locale: Locale) {
  const languages: Record<string, string> = {};

  for (const l of LOCALES) {
    languages[LOCALE_HTML_LANG[l]] = `${SITE_URL}${localeHref(path, l)}`;
  }
  languages['x-default'] = `${SITE_URL}${localeHref(path, DEFAULT_LOCALE)}`;

  return { canonical: `${SITE_URL}${localeHref(path, locale)}`, languages };
}

export function buildAutoRentalJsonLd(args: {
  settings: SettingsInput;
  priceRange: string;
  url: string;
  locale: Locale;
}) {
  const { settings, priceRange, url, locale } = args;

  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: 'LIANS',
    description: pickLocale(settings.heroSubtitle, locale) ?? '',
    url,
    telephone: settings.phone,
    priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jalan Pomorow (Depan Luwansa Hotel)',
      addressLocality: 'Manado',
      addressRegion: 'Sulawesi Utara',
      postalCode: '95125',
      addressCountry: 'ID',
    },
    areaServed: { '@type': 'City', name: 'Manado' },
    openingHours: pickLocale(settings.operatingHours, locale) ?? '',
  };
}

export function buildVehicleJsonLd(args: { vehicle: Vehicle; url: string }) {
  const { vehicle, url } = args;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: vehicle.name,
    url,
    brand: { '@type': 'Brand', name: 'LIANS' },
    offers: {
      '@type': 'Offer',
      price: vehicle.rate24h,
      priceCurrency: 'IDR',
      availability:
        vehicle.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url,
    },
  };
}
