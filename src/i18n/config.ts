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

/**
 * Bentuk pendek untuk tombol pemilih bahasa di bilah atas.
 *
 * Nama panjang keempat bahasa berjejer memakan ruang yang tidak ada, dan saat
 * terdesak label CJK terpecah per aksara — 中文 menjadi dua baris. Nama
 * lengkapnya tetap muncul begitu daftarnya dibuka.
 */
export const LOCALE_SHORT: Record<Locale, string> = {
  id: 'ID',
  en: 'EN',
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
