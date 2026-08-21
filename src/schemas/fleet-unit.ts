import { z } from 'zod';

/**
 * Unit fisik milik LIANS. Model wajib dipilih: unit tanpa model tidak dapat
 * ditawarkan sebagai pilihan pada pesanan mana pun, dan hanya akan menumpuk
 * sebagai baris yang tidak berguna.
 */
export const fleetUnitInputSchema = z.object({
  plate: z.string().trim().min(3, 'Nomor polisi wajib diisi').max(20),
  vehicleId: z.string().uuid('Pilih model kendaraannya'),
  notes: z.string().trim().max(500).optional(),
  isActive: z.boolean().default(true),
});

export type FleetUnitInput = z.infer<typeof fleetUnitInputSchema>;
