import { z } from 'zod';

export const customerInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid. Contoh: 081234567890'),
  email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),
  notes: z.string().max(2000).optional(),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
