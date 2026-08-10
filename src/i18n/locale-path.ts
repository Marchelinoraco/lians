import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * Memisahkan awalan bahasa dari path.
 * Bahasa bawaan tidak memakai awalan, jadi "/id/mobil" adalah path biasa —
 * bukan bahasa Indonesia yang diberi awalan.
 */
export function splitLocalePath(pathname: string): { locale: Locale; rest: string } {
  const segmen = pathname.split('/').filter(Boolean);
  const pertama = segmen[0];

  if (pertama && pertama !== DEFAULT_LOCALE && isLocale(pertama)) {
    const sisa = `/${segmen.slice(1).join('/')}`;
    return { locale: pertama, rest: sisa === '/' ? '/' : sisa };
  }

  return { locale: DEFAULT_LOCALE, rest: pathname === '' ? '/' : pathname };
}

/** Kebalikan splitLocalePath: menyusun URL untuk sebuah path dalam bahasa tertentu. */
export function localeHref(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}

/** Path internal App Router — selalu diawali segmen bahasa, termasuk untuk Indonesia. */
export function toAppPath(pathname: string): string {
  const { locale, rest } = splitLocalePath(pathname);
  return rest === '/' ? `/${locale}` : `/${locale}${rest}`;
}
