import { differenceInCalendarDays, format } from 'date-fns';
import { id as idLocale, enUS, zhCN, ko as koLocale } from 'date-fns/locale';
import { DEFAULT_LOCALE, type Locale } from '@/i18n/config';

/**
 * Jumlah hari sewa dihitung inklusif: tanggal mulai dan tanggal selesai
 * dua-duanya dihitung. 15 sampai 17 Agustus = 3 hari.
 */
export function countRentalDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}

const DATE_FNS_LOCALE = { id: idLocale, en: enUS, zh: zhCN, ko: koLocale };

const DATE_PATTERN: Record<Locale, string> = {
  id: 'd MMMM yyyy',
  en: 'd MMMM yyyy',
  zh: 'yyyy年M月d日',
  ko: 'yyyy년 M월 d일',
};

/**
 * Jatuh ke bahasa Indonesia untuk nilai yang bukan bahasa yang dikenal, dengan
 * alasan yang sama seperti `getMessages`: nilainya datang dari segmen URL
 * `[locale]` yang cocok dengan teks apa pun. Tanpa jaring ini, date-fns
 * menerima pola `undefined` lalu melempar saat memanggil `.match` padanya, dan
 * permintaan yang seharusnya 404 berakhir 500.
 */
export function formatTanggal(d: Date, locale: Locale): string {
  const pola = (DATE_PATTERN as Record<string, string | undefined>)[locale] ?? DATE_PATTERN[DEFAULT_LOCALE];
  const bahasa =
    (DATE_FNS_LOCALE as Record<string, (typeof DATE_FNS_LOCALE)[Locale] | undefined>)[locale] ??
    DATE_FNS_LOCALE[DEFAULT_LOCALE];
  return format(d, pola, { locale: bahasa });
}
