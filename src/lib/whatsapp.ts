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
  days?: number | null;
  categoryLabel?: string | null;
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
  if (a.days) baris.push(`Durasi: ${a.days} hari`);
  if (a.categoryLabel) baris.push(`Kategori: ${a.categoryLabel}`);
  if (a.notes) baris.push(`Catatan: ${a.notes}`);

  baris.push(``);
  baris.push(
    a.totalPrice === null
      ? `Total: menunggu penawaran harga dari LIANS`
      : `Total: ${formatRupiah(a.totalPrice)}`,
  );

  return baris.join('\n');
}

export type TourMessageArgs = {
  requestCode: string;
  tourName: string;
  customerName: string;
  pax: number;
  startDate: string;
  endDate?: string | null;
  notes?: string | null;
};

/**
 * Sama seperti pesan booking, selalu berbahasa Indonesia — yang membacanya staf
 * LIANS di Manado, bukan customer.
 *
 * Tanpa baris harga sama sekali: paket tur memang tidak menampilkan harga, dan
 * penawarannya justru yang sedang diminta lewat pesan ini.
 */
export function buildTourRequestMessage(a: TourMessageArgs): string {
  const baris: string[] = [
    `Halo LIANS, saya ingin meminta penawaran paket wisata.`,
    ``,
    `Kode: ${a.requestCode}`,
    `Nama: ${a.customerName}`,
    `Paket: ${a.tourName}`,
    `Jumlah peserta: ${a.pax} orang`,
    `Tanggal mulai: ${formatTanggal(new Date(a.startDate), 'id')}`,
  ];

  if (a.endDate) baris.push(`Tanggal selesai: ${formatTanggal(new Date(a.endDate), 'id')}`);
  if (a.notes) baris.push(`Catatan: ${a.notes}`);

  baris.push(``);
  baris.push(`Mohon informasi harga dan ketersediaannya. Terima kasih.`);

  return baris.join('\n');
}

export type TicketMessageArgs = {
  requestCode: string;
  origin: string;
  destination: string;
  airlineName?: string | null;
  departureDate: string;
  returnDate?: string | null;
  pax: number;
  customerName: string;
  notes?: string | null;
};

/**
 * Berbahasa Indonesia seperti pesan lainnya — yang membacanya staf di Manado.
 *
 * Tanpa baris harga: tarif penerbangan berubah setiap jam, dan penawarannya
 * justru yang sedang diminta lewat pesan ini.
 */
export function buildTicketRequestMessage(a: TicketMessageArgs): string {
  const baris: string[] = [
    `Halo LIANS, saya ingin memesan tiket pesawat.`,
    ``,
    `Kode: ${a.requestCode}`,
    `Nama: ${a.customerName}`,
    `Rute: ${a.origin} → ${a.destination}`,
    `Maskapai: ${a.airlineName ?? 'Belum menentukan, mohon dibantu'}`,
    `Keberangkatan: ${formatTanggal(new Date(a.departureDate), 'id')}`,
  ];

  if (a.returnDate) baris.push(`Kembali: ${formatTanggal(new Date(a.returnDate), 'id')}`);
  baris.push(`Jumlah penumpang: ${a.pax} orang`);
  if (a.notes) baris.push(`Catatan: ${a.notes}`);

  baris.push(``);
  baris.push(`Mohon dicek harga dan ketersediaan kursinya. Terima kasih.`);

  return baris.join('\n');
}
