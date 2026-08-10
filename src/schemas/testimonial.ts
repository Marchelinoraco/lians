import { z } from 'zod';
import { localizedString } from './localized';

export const testimonialInputSchema = z.object({
  customerName: z.string().trim().min(2, 'Nama wajib diisi').max(100),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: localizedString(z.string().trim().min(10, 'Ulasan minimal 10 karakter').max(500)),
  vehicleName: z.string().trim().max(100).nullable().default(null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;
