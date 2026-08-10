import type { Locale } from './config';
import id from './messages/id';
import en from './messages/en';
import zh from './messages/zh';
import ko from './messages/ko';

/** Bahasa Indonesia adalah sumber kebenaran bentuk kamus. */
export type Messages = typeof id;

const KAMUS: Record<Locale, Messages> = { id, en, zh, ko };

export function getMessages(locale: Locale): Messages {
  return KAMUS[locale];
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
