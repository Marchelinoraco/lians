'use server';

import { headers } from 'next/headers';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { bookingInputSchema } from '@/schemas/booking';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import { generateBookingCode } from '@/lib/booking-code';
import { buildBookingMessage, waLink } from '@/lib/whatsapp';
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
import { checkRateLimit } from '@/lib/rate-limit';
import { getVehicleById } from '@/queries/vehicles';
import { getRouteById } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { fail, ok, type ActionResult } from './result';

const PESAN_KESALAHAN: Record<string, string> = {
  CATEGORY_UNAVAILABLE: 'Kendaraan ini tidak tersedia untuk kategori yang dipilih.',
  END_BEFORE_START: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
};

const LABEL_KATEGORI: Record<string, string> = {
  'lepas-kunci': 'Lepas kunci',
  pelayanan: 'Pelayanan (mobil + sopir + BBM)',
};

export async function createBooking(
  input: unknown,
): Promise<ActionResult<{ bookingCode: string; whatsappUrl: string }>> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'tanpa-ip';
  const lolos = await checkRateLimit(`booking:${ip}`, 5, 60 * 60 * 1000);
  if (!lolos) {
    return fail('Terlalu banyak pesanan dari perangkat ini. Silakan hubungi kami lewat WhatsApp.');
  }

  const parsed = bookingInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return fail('Periksa kembali isian Anda.', fieldErrors);
  }

  const data = parsed.data;
  const settings = await getSettings();

  let totalPrice: number | null;
  let priceBreakdown = null;
  let itemName: string;
  let days: number | null = null;
  let categoryLabel: string | null = null;

  if (data.serviceType === 'travel') {
    const route = await getRouteById(data.routeId);
    if (!route || !route.isPublished) return fail('Rute tidak ditemukan.');
    itemName = `${route.origin} → ${route.destination}`;
    totalPrice = calculateTravelPrice(route.price);
  } else {
    const vehicle = await getVehicleById(data.vehicleId);
    if (!vehicle || !vehicle.isPublished) return fail('Kendaraan tidak ditemukan.');
    if (vehicle.status !== 'available') {
      return fail('Kendaraan ini sedang tersewa. Silakan pilih kendaraan lain atau hubungi kami.');
    }

    // Harga selalu dihitung ulang dari tarif di database.
    // Angka yang dikirim browser hanya untuk tampilan dan tidak pernah dipercaya.
    const hasil = calculateRentalPrice({
      vehicle: {
        rateLepasKunci: vehicle.rateLepasKunci,
        ratePelayanan: vehicle.ratePelayanan,
      },
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      category: data.rateCategory,
    });

    if (!hasil.ok) return fail(PESAN_KESALAHAN[hasil.error] ?? 'Perhitungan harga gagal.');

    itemName = vehicle.name;
    totalPrice = hasil.breakdown.total;
    priceBreakdown = hasil.breakdown;
    days = hasil.breakdown.days;
    categoryLabel = LABEL_KATEGORI[data.rateCategory] ?? null;
  }

  const bookingCode = generateBookingCode(new Date());

  // Daftar pelanggan dibangun dari seluruh jalur masuk, bukan hanya dari input
  // manual admin. Nama dan telepon tetap disalin ke pesanan di bawah.
  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });

  await db.insert(bookings).values({
    bookingCode,
    customerName: data.customerName,
    phone: data.phone,
    email: data.email || null,
    customerId,
    serviceType: data.serviceType,
    vehicleId: data.serviceType === 'travel' ? null : data.vehicleId,
    routeId: data.serviceType === 'travel' ? data.routeId : null,
    vehicleNameSnapshot: data.serviceType === 'travel' ? null : itemName,
    routeNameSnapshot: data.serviceType === 'travel' ? itemName : null,
    startDate: data.startDate,
    endDate: data.serviceType === 'travel' ? null : data.endDate,
    rateCategory: data.serviceType === 'travel' ? null : data.rateCategory,
    totalPrice,
    priceBreakdown,
    notes: data.notes || null,
    status: 'pending',
  });

  const pesan = buildBookingMessage({
    bookingCode,
    customerName: data.customerName,
    itemName,
    startDate: data.startDate,
    endDate: data.serviceType === 'travel' ? null : data.endDate,
    days,
    categoryLabel,
    totalPrice,
    notes: data.notes,
  });

  return ok({ bookingCode, whatsappUrl: waLink(settings.whatsappNumber, pesan) });
}
