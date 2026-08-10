import { DEFAULT_LOCALE, type Locale } from './config';

/** Bahasa Indonesia wajib ada; sisanya opsional. */
export type Localized<T> = { id: T } & Partial<Record<Locale, T>>;

function kosong(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/**
 * Mengambil nilai untuk sebuah bahasa, jatuh ke bahasa Indonesia
 * bila terjemahannya belum diisi. Halaman tidak pernah bolong hanya
 * karena staf belum sempat menerjemahkan.
 */
export function pickLocale<T>(value: Localized<T> | null | undefined, locale: Locale): T | null {
  if (!value) return null;

  const diminta = value[locale];
  if (!kosong(diminta)) return diminta as T;

  const bawaan = value[DEFAULT_LOCALE];
  return kosong(bawaan) ? null : (bawaan as T);
}

export function toLocalized<T>(value: T): Localized<T> {
  return { [DEFAULT_LOCALE]: value } as Localized<T>;
}
