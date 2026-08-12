import { z } from 'zod';
import { localizedArray } from './localized';

export const vehicleInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama kendaraan wajib diisi').max(100),
    slug: z.string().trim().optional(),
    category: z.enum(['hatchback', 'sedan', 'suv', 'mpv', 'luxury', 'bus']),
    images: z
      .array(z.object({ url: z.string().url(), publicId: z.string(), alt: z.string() }))
      .default([]),
    rateLepasKunci: z.coerce.number().int().min(0).nullable().default(null),
    ratePelayanan: z.coerce.number().int().min(0).nullable().default(null),
    serviceTypes: z
      .array(z.enum(['self-drive', 'with-driver', 'tourism']))
      .min(1, 'Pilih minimal satu jenis layanan'),
    seats: z.coerce.number().int().min(1).max(60),
    transmission: z.enum(['manual', 'automatic']),
    fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
    year: z.coerce
      .number()
      .int()
      .min(1990)
      .max(new Date().getFullYear() + 1),
    luggage: z.coerce.number().int().min(0).default(0),
    features: localizedArray(z.string().trim().min(1)),
    rentalTerms: localizedArray(z.string().trim().min(1)),
    status: z.enum(['available', 'unavailable']).default('available'),
    isPublished: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => v.rateLepasKunci !== null || v.ratePelayanan !== null, {
    path: ['rateLepasKunci'],
    message: 'Isi minimal satu tarif: lepas kunci atau pelayanan',
  });

export type VehicleInput = z.infer<typeof vehicleInputSchema>;
