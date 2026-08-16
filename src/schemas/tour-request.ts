import { z } from 'zod';
import { TOUR_SLUGS } from '@/data/tours';

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

/**
 * Bidang yang sama untuk form publik dan pencatatan manual.
 *
 * Dipisah supaya aturan nomor telepon, batas peserta, dan format tanggal hanya
 * ditulis sekali. Disalin ke dua berkas, keduanya pasti akan berbeda begitu
 * salah satunya diperbaiki.
 */
export const bidangPermintaanTur = {
  // Dicocokkan dengan daftar paket yang benar-benar ada, bukan sekadar string
  // apa pun: form ini publik dan slug-nya dikirim dari browser.
  tourSlug: z.string().refine((s) => TOUR_SLUGS.includes(s), 'Paket tidak ditemukan'),

  customerName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor WhatsApp tidak valid. Contoh: 081234567890'),
  email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),

  pax: z.coerce
    .number()
    .int('Jumlah peserta harus bilangan bulat')
    .min(1, 'Minimal 1 peserta')
    .max(60, 'Untuk rombongan di atas 60 orang, hubungi kami langsung'),

  startDate: tanggal,
  endDate: z.union([z.literal(''), tanggal]).optional(),

  notes: z.string().max(2000).optional(),
} as const;

/** Tanggal selesai tidak boleh mendahului tanggal mulai. */
export function periksaUrutanTanggalTur(
  data: { startDate: string; endDate?: string },
  ctx: z.RefinementCtx,
) {
  if (!data.endDate) return;

  // Dibandingkan sebagai string karena keduanya berformat YYYY-MM-DD, sehingga
  // urutan leksikografisnya sama dengan urutan kalendernya.
  if (data.endDate < data.startDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['endDate'],
      message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
    });
  }
}

export const tourRequestSchema = z.object(bidangPermintaanTur).superRefine(periksaUrutanTanggalTur);

export type TourRequestInput = z.infer<typeof tourRequestSchema>;
