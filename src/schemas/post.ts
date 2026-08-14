import { z } from 'zod';

const localizedText = z.object({ id: z.string(), en: z.string().optional(), zh: z.string().optional(), ko: z.string().optional() });
const localizedList = z.object({
  id: z.array(z.string()),
  en: z.array(z.string()).optional(),
  zh: z.array(z.string()).optional(),
  ko: z.array(z.string()).optional(),
});

export const postInputSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(3, 'Slug minimal 3 karakter')
    .max(120)
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung'),

  // Hanya bahasa Indonesia yang wajib. Terjemahan boleh menyusul — tanpa itu,
  // staf tidak bisa menerbitkan apa pun sebelum menguasai empat bahasa.
  title: localizedText.refine((v) => v.id.trim().length >= 3, {
    message: 'Judul bahasa Indonesia wajib diisi',
    path: ['id'],
  }),
  excerpt: localizedText,
  body: localizedList.refine((v) => v.id.filter((b) => b.trim()).length > 0, {
    message: 'Isi artikel bahasa Indonesia wajib diisi',
    path: ['id'],
  }),

  coverImage: z
    .array(z.object({ url: z.string().url(), publicId: z.string(), alt: z.string() }))
    .max(1, 'Sampul hanya satu foto'),

  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid'),
  isPublished: z.boolean(),
});

export type PostInput = z.infer<typeof postInputSchema>;
