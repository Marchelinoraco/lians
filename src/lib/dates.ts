import { differenceInCalendarDays, format } from 'date-fns';
import { id as idLocale, enUS, zhCN, ko as koLocale } from 'date-fns/locale';
import type { Locale } from '@/i18n/config';

/**
 * Jumlah hari sewa = selisih hari kalender, minimum 1.
 * 1 Agustus sampai 3 Agustus = 2 hari (dua periode 24 jam).
 */
export function countRentalDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start));
}

const DATE_FNS_LOCALE = { id: idLocale, en: enUS, zh: zhCN, ko: koLocale };

const DATE_PATTERN: Record<Locale, string> = {
  id: 'd MMMM yyyy',
  en: 'd MMMM yyyy',
  zh: 'yyyy年M月d日',
  ko: 'yyyy년 M월 d일',
};

export function formatTanggal(d: Date, locale: Locale): string {
  return format(d, DATE_PATTERN[locale], { locale: DATE_FNS_LOCALE[locale] });
}
