import { z } from 'zod';
import { localizedString } from './localized';

export const routeInputSchema = z.object({
  origin: z.string().trim().min(2, 'Asal wajib diisi').max(100),
  destination: z.string().trim().min(2, 'Tujuan wajib diisi').max(100),
  price: z.coerce.number().int().min(0).nullable().default(null),
  vehicleNote: localizedString(z.string().trim().max(100)).nullable().default(null),
  estimatedDuration: localizedString(z.string().trim().max(50)).nullable().default(null),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type RouteInput = z.infer<typeof routeInputSchema>;
