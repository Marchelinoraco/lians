import { z } from 'zod';

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

/**
 * Berbeda dari booking website dalam dua hal yang disengaja: tanggal hanya
 * keterangan, dan total harga diketik admin.
 *
 * Booking manual justru dipakai untuk kasus yang tidak muat di rumus — sewa
 * campuran, harga negosiasi, paket khusus. Memaksakan perhitungan otomatis di
 * sini hanya membuat admin melawan sistemnya sendiri.
 */
export const manualBookingInputSchema = z
  .object({
    customerName: z.string().trim().min(2, 'Nama pelanggan wajib diisi').max(100),
    phone: z
      .string()
      .trim()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid'),
    email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),

    serviceType: z.enum(['self-drive', 'with-driver', 'tourism', 'travel']),
    itemName: z.string().trim().min(2, 'Keterangan pesanan wajib diisi').max(200),

    startDate: tanggal,
    endDate: z.union([z.literal(''), tanggal]).optional(),

    // Minimal 1, bukan 0: form mengirim 0 untuk kolom yang dikosongkan, jadi
    // batas 0 akan meloloskan pesanan tanpa harga tanpa satu pun pesan galat.
    totalPrice: z.coerce.number().int().min(1, 'Total harga wajib diisi'),

    asalKendaraan: z.enum(['sendiri', 'pemasok']),
    // Boleh kosong: sebagian pesanan manual memang tidak terkait satu unit
    // tertentu — paket gabungan, atau kendaraan yang belum terdaftar di armada.
    vehicleId: z.union([z.literal(''), z.string().uuid()]).optional(),
    supplierVehicleId: z.union([z.literal(''), z.string().uuid()]).optional(),
    supplierCost: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
    supplierPaid: z.boolean().default(false),

    notes: z.string().max(2000).optional(),
    adminNotes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.asalKendaraan !== 'pemasok') return;

    if (!data.supplierVehicleId) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplierVehicleId'],
        message: 'Pilih kendaraan pemasok',
      });
    }

    // Tanpa nominal, penanda lunas hanya menghasilkan hitungan pesanan —
    // bukan angka rupiah yang bisa ditagih.
    if (data.supplierCost === '' || data.supplierCost === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplierCost'],
        message: 'Isi biaya yang dibayar ke pemasok',
      });
    }
  });

export type ManualBookingInput = z.infer<typeof manualBookingInputSchema>;
