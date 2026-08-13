import { DEFAULT_LOCALE, type Locale } from './config';
import id from './messages/id';
import en from './messages/en';
import zh from './messages/zh';
import ko from './messages/ko';

/** Bahasa Indonesia adalah sumber kebenaran bentuk kamus. */
export type Messages = typeof id;

const KAMUS: Record<Locale, Messages> = { id, en, zh, ko };

/**
 * Jatuh ke bahasa Indonesia untuk nilai yang bukan bahasa yang dikenal.
 *
 * Terlihat berlebihan karena tipenya sudah `Locale`, tetapi nilainya datang
 * dari segmen URL `[locale]` yang cocok dengan teks apa pun — termasuk
 * "TidakAda.png", karena proxy sengaja melewatkan path berekstensi agar aset
 * statis tidak ditulis ulang.
 *
 * Layout `[locale]` sudah memanggil `notFound()` untuk nilai semacam itu,
 * sehingga statusnya tetap 404. Tetapi Next merender layout dan page
 * bersamaan: tanpa jaring ini, page tetap dievaluasi lebih dulu, membaca
 * `t.home` dari undefined, dan seluruh permintaan berakhir 500 — bukan 404.
 */
export function getMessages(locale: Locale): Messages {
  // Diberi tipe Locale, tetapi nilainya bisa string sembarang saat sampai ke
  // sini lewat params — karena itu diperiksa, bukan sekadar dipercaya tipenya.
  return (KAMUS as Record<string, Messages | undefined>)[locale] ?? KAMUS[DEFAULT_LOCALE];
}

/** Mengisi placeholder: fill('Menampilkan {n} dari {total}', { n: 3, total: 8 }) */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (cocok, kunci) =>
    kunci in values ? String(values[kunci]) : cocok,
  );
}

export * from './config';
export * from './localized';
export * from './locale-path';
