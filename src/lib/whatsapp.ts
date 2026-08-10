import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';

/** 081234567890 dan +6281234567890 sama-sama menjadi 6281234567890. */
export function normalizePhone(phone: string): string {
  const digit = phone.replace(/\D/g, '');
  if (digit.startsWith('62')) return digit;
  if (digit.startsWith('0')) return `62${digit.slice(1)}`;
  return `62${digit}`;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}

export type BookingMessageArgs = {
  bookingCode: string;
  customerName: string;
  itemName: string;
  startDate: string;
  endDate?: string | null;
  rateType?: '24h' | '12h' | null;
  days?: number | null;
  driverDays: number;
  totalPrice: number | null;
  notes?: string | null;
};

/**
 * Pesan WhatsApp selalu berbahasa Indonesia, apa pun bahasa yang dipakai
 * customer. Yang membaca pesan ini staf LIANS di Manado — menerjemahkannya ke
 * bahasa customer justru membuat staf harus menebak isi pesanannya sendiri.
 */
export function buildBookingMessage(a: BookingMessageArgs): string {
  const baris: string[] = [
    `Halo LIANS, saya ingin konfirmasi pesanan.`,
    ``,
    `Kode: ${a.bookingCode}`,
    `Nama: ${a.customerName}`,
    `Pesanan: ${a.itemName}`,
    `Mulai: ${formatTanggal(new Date(a.startDate), 'id')}`,
  ];

  if (a.endDate) baris.push(`Selesai: ${formatTanggal(new Date(a.endDate), 'id')}`);
  if (a.days) baris.push(`Durasi: ${a.days} hari (paket ${a.rateType === '12h' ? '12' : '24'} jam)`);
  if (a.driverDays > 0) baris.push(`Pakai sopir: ${a.driverDays} hari`);
  if (a.notes) baris.push(`Catatan: ${a.notes}`);

  baris.push(``);
  baris.push(
    a.totalPrice === null
      ? `Total: menunggu penawaran harga dari LIANS`
      : `Total: ${formatRupiah(a.totalPrice)}`,
  );

  return baris.join('\n');
}
