'use server';

import { headers } from 'next/headers';
import { db } from '@/db';
import { tourRequests } from '@/db/schema';
import { tourRequestSchema } from '@/schemas/tour-request';
import { getTourBySlug } from '@/data/tours';
import { generateBookingCode } from '@/lib/booking-code';
import { buildTourRequestMessage, waLink } from '@/lib/whatsapp';
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSettings } from '@/queries/settings';
import { fail, ok, type ActionResult } from './result';

export async function createTourRequest(
  input: unknown,
): Promise<ActionResult<{ requestCode: string; whatsappUrl: string }>> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'tanpa-ip';
  const lolos = await checkRateLimit(`tur:${ip}`, 5, 60 * 60 * 1000);
  if (!lolos) {
    return fail('Terlalu banyak permintaan dari perangkat ini. Silakan hubungi kami lewat WhatsApp.');
  }

  const parsed = tourRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;

  // Skema sudah memastikan slug-nya ada, tetapi namanya diambil dari sini agar
  // yang tersimpan benar-benar nama paket, bukan kiriman browser.
  const tour = getTourBySlug(data.tourSlug);
  if (!tour) return fail('Paket tidak ditemukan.');

  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });

  const requestCode = generateBookingCode(new Date());

  await db.insert(tourRequests).values({
    requestCode,
    tourSlug: tour.slug,
    // Nama Indonesia yang disalin: staf yang membaca panel admin berbahasa
    // Indonesia, apa pun bahasa yang dipakai customer saat memesan.
    tourNameSnapshot: tour.name.id,
    customerName: data.customerName,
    phone: data.phone,
    email: data.email || null,
    customerId,
    pax: data.pax,
    startDate: data.startDate,
    endDate: data.endDate || null,
    notes: data.notes || null,
    status: 'pending',
  });

  const settings = await getSettings();
  const pesan = buildTourRequestMessage({
    requestCode,
    tourName: tour.name.id,
    customerName: data.customerName,
    pax: data.pax,
    startDate: data.startDate,
    endDate: data.endDate,
    notes: data.notes,
  });

  return ok({ requestCode, whatsappUrl: waLink(settings.whatsappNumber, pesan) });
}
