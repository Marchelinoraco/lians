import { z } from 'zod';

export const supplierInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama pemasok wajib diisi').max(100),
  phone: z
    .union([
      z.literal(''),
      z.string().trim().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid'),
    ])
    .optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export const supplierVehicleInputSchema = z.object({
  supplierId: z.string().uuid('Pemasok wajib dipilih'),
  name: z.string().trim().min(2, 'Nama kendaraan wajib diisi').max(100),
  notes: z.string().max(500).optional(),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type SupplierVehicleInput = z.infer<typeof supplierVehicleInputSchema>;
