import { z } from 'zod';
import { localizedString } from './localized';

export const settingsInputSchema = z.object({
  whatsappNumber: z
    .string()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor WhatsApp tidak valid'),
  phone: z.string().trim().max(30),
  email: z.union([z.literal(''), z.string().email()]),
  address: z.string().trim().min(5),
  mapsUrl: z.union([z.literal(''), z.string().url()]),
  socialLinks: z
    .array(z.object({ label: z.string().trim().min(1), url: z.string().url() }))
    .default([]),

  // Lima kunci berikut dapat diterjemahkan.
  operatingHours: localizedString(z.string().trim().max(200)),
  heroTitle: localizedString(z.string().trim().max(120)),
  heroSubtitle: localizedString(z.string().trim().max(300)),
  aboutText: localizedString(z.string().trim().max(4000)),
  promoBanner: localizedString(z.string().trim().max(200)),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
