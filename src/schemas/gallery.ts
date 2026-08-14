import { z } from 'zod';

export const galleryInputSchema = z.object({
  image: z
    .array(z.object({ url: z.string().url(), publicId: z.string(), alt: z.string() }))
    .length(1, 'Pilih satu foto'),
  caption: z.object({
    id: z.string().max(200),
    en: z.string().max(200).optional(),
    zh: z.string().max(200).optional(),
    ko: z.string().max(200).optional(),
  }),
  isPublished: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

export type GalleryInput = z.infer<typeof galleryInputSchema>;
