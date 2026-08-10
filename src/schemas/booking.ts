import { z } from 'zod';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

const teleponID = z
  .string()
  .trim()
  .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid. Contoh: 081234567890');

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

const dasar = {
  customerName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: teleponID,
  email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),
  notes: z.string().max(1000).optional(),
  startDate: tanggal,
};

const sewaKendaraan = z.object({
  ...dasar,
  serviceType: z.enum(['self-drive', 'with-driver', 'tourism']),
  vehicleId: z.string().uuid('Kendaraan wajib dipilih'),
  routeId: z.undefined().optional(),
  endDate: tanggal,
  rateType: z.enum(['24h', '12h']),
  driverDays: z.number().int().min(0),
});

const travel = z.object({
  ...dasar,
  serviceType: z.literal('travel'),
  routeId: z.string().uuid('Rute wajib dipilih'),
  vehicleId: z.undefined().optional(),
  endDate: z.undefined().optional(),
  rateType: z.undefined().optional(),
  driverDays: z.literal(0).optional().default(0),
});

export const bookingInputSchema = z
  .discriminatedUnion('serviceType', [sewaKendaraan, travel])
  .superRefine((data, ctx) => {
    const mulai = startOfDay(new Date(data.startDate));

    if (mulai < startOfDay(new Date())) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'Tanggal mulai tidak boleh di masa lalu',
      });
    }

    if (data.serviceType === 'travel') return;

    const selesai = startOfDay(new Date(data.endDate));
    if (selesai < mulai) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Tanggal selesai harus setelah tanggal mulai',
      });
      return;
    }

    const jumlahHari = Math.max(1, differenceInCalendarDays(selesai, mulai));
    if (data.driverDays > jumlahHari) {
      ctx.addIssue({
        code: 'custom',
        path: ['driverDays'],
        message: `Hari pakai sopir tidak boleh lebih dari ${jumlahHari} hari sewa`,
      });
    }
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;
