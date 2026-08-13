'use server';

import { headers } from 'next/headers';
import { db } from '@/db';
import { ticketRequests } from '@/db/schema';
import { ticketRequestSchema } from '@/schemas/ticket-request';
import { namaMaskapai } from '@/data/maskapai';
import { generateBookingCode } from '@/lib/booking-code';
import { buildTicketRequestMessage, waLink } from '@/lib/whatsapp';
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
import { checkRateLimit } from '@/lib/rate-limit';
import { getSettings } from '@/queries/settings';
import { fail, ok, type ActionResult } from './result';

export async function createTicketRequest(
  input: unknown,
): Promise<ActionResult<{ requestCode: string; whatsappUrl: string }>> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'tanpa-ip';
  const lolos = await checkRateLimit(`tiket:${ip}`, 5, 60 * 60 * 1000);
  if (!lolos) {
    return fail(
      'Terlalu banyak permintaan dari perangkat ini. Silakan hubungi kami lewat WhatsApp.',
    );
  }

  const parsed = ticketRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;

  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });

  const requestCode = generateBookingCode(new Date());

  await db.insert(ticketRequests).values({
    requestCode,
    origin: data.origin,
    destination: data.destination,
    airline: data.airline || null,
    departureDate: data.departureDate,
    returnDate: data.returnDate || null,
    pax: data.pax,
    customerName: data.customerName,
    phone: data.phone,
    email: data.email || null,
    customerId,
    notes: data.notes || null,
    status: 'pending',
  });

  const settings = await getSettings();
  const pesan = buildTicketRequestMessage({
    requestCode,
    origin: data.origin,
    destination: data.destination,
    // Nama diambil dari daftar di server, bukan dari kiriman browser.
    airlineName: namaMaskapai(data.airline),
    departureDate: data.departureDate,
    returnDate: data.returnDate,
    pax: data.pax,
    customerName: data.customerName,
    notes: data.notes,
  });

  return ok({ requestCode, whatsappUrl: waLink(settings.whatsappNumber, pesan) });
}
