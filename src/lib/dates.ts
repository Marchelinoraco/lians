import { differenceInCalendarDays, format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Jumlah hari sewa = selisih hari kalender, minimum 1.
 * 1 Agustus sampai 3 Agustus = 2 hari (dua periode 24 jam).
 */
export function countRentalDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start));
}

export function formatTanggalID(d: Date): string {
  return format(d, 'd MMMM yyyy', { locale: id });
}
