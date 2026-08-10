export const LOCALES = ['id', 'en', 'zh', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'id';

/** Ditulis dalam bahasa masing-masing — orang mencari bahasanya sendiri, bukan namanya dalam bahasa kita. */
export const LOCALE_LABELS: Record<Locale, string> = {
  id: 'Indonesia',
  en: 'English',
  zh: '中文',
  ko: '한국어',
};

/** Kode untuk atribut html lang dan hreflang. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en',
  zh: 'zh-CN',
  ko: 'ko-KR',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
