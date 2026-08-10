import { z } from 'zod';

/**
 * Bahasa Indonesia wajib, tiga lainnya opsional.
 *
 * Ditulis eksplisit per bahasa, bukan dibangkitkan dari daftar LOCALES.
 * Versi dinamis memaksa cast ke `Record<string, ZodTypeAny>` yang membuang
 * seluruh tipe hasilnya — justru menghilangkan alasan memakai Zod.
 * Konsekuensinya: menambah bahasa kelima kelak perlu menyentuh berkas ini.
 */
export function localizedString(inner: z.ZodString) {
  const opsional = inner.or(z.literal('')).optional();
  return z.object({
    id: inner,
    en: opsional,
    zh: opsional,
    ko: opsional,
  });
}

export function localizedArray(inner: z.ZodString) {
  const daftar = z.array(inner);
  return z.object({
    // Wajib ada, tetapi boleh berupa daftar kosong. Tanpa `.default([])`,
    // karena default membuat kunci ini opsional — dan kendaraan yang fasilitasnya
    // hanya diisi dalam bahasa Inggris akan tampil kosong bagi pengunjung
    // Indonesia, yang justru pasar utamanya.
    id: daftar,
    en: daftar.optional(),
    zh: daftar.optional(),
    ko: daftar.optional(),
  });
}
