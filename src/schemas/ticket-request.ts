import { z } from 'zod';
import { MASKAPAI_KODE } from '@/data/maskapai';

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

export const ticketRequestSchema = z
  .object({
    origin: z.string().trim().min(2, 'Kota asal wajib diisi').max(100),
    destination: z.string().trim().min(2, 'Kota tujuan wajib diisi').max(100),

    // Kosong berarti "belum menentukan" — pilihan yang sah, bukan isian
    // terlewat. Selain itu wajib salah satu kode yang benar-benar ada.
    airline: z
      .union([z.literal(''), z.string().refine((s) => MASKAPAI_KODE.includes(s), 'Maskapai tidak dikenal')])
      .optional(),

    departureDate: tanggal,
    returnDate: z.union([z.literal(''), tanggal]).optional(),

    pax: z.coerce
      .number()
      .int('Jumlah penumpang harus bilangan bulat')
      .min(1, 'Minimal 1 penumpang')
      .max(50, 'Untuk rombongan di atas 50 orang, hubungi kami langsung'),

    customerName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
    phone: z
      .string()
      .trim()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor WhatsApp tidak valid. Contoh: 081234567890'),
    email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),

    notes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.returnDate && data.returnDate < data.departureDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['returnDate'],
        message: 'Tanggal kembali tidak boleh sebelum tanggal keberangkatan',
      });
    }

    // Rute dari dan ke kota yang sama hampir pasti salah ketik, dan staf akan
    // menghabiskan satu putaran WhatsApp hanya untuk menanyakannya.
    if (data.origin.trim().toLowerCase() === data.destination.trim().toLowerCase()) {
      ctx.addIssue({
        code: 'custom',
        path: ['destination'],
        message: 'Kota tujuan tidak boleh sama dengan kota asal',
      });
    }
  });

export type TicketRequestInput = z.infer<typeof ticketRequestSchema>;
