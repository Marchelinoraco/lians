'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { tourRequests, ticketRequests } from '@/db/schema';
import {
  manualTourRequestSchema,
  manualTicketRequestSchema,
} from '@/schemas/manual-permintaan';
import { getTourBySlug } from '@/data/tours';
import { generateBookingCode } from '@/lib/booking-code';
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
import { normalizePhone } from '@/lib/whatsapp';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';
import { catatAktivitas } from '@/lib/aktivitas';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

/**
 * Mencatat permintaan tur yang masuk lewat telepon atau WhatsApp.
 *
 * Berbeda dari jalur publik dalam tiga hal, semuanya karena yang mengetik
 * adalah staf yang sudah masuk:
 *
 *   - Tanpa pembatas laju. Pembatas di form publik menahan pengiriman
 *     bertubi-tubi dari satu alamat IP; di sini justru mengganggu, karena
 *     mencatat lima telepon berturut-turut adalah pekerjaan yang wajar.
 *   - Tanpa balasan tautan WhatsApp. Percakapannya sudah terjadi.
 *   - Status boleh dipilih. Sebagian permintaan sudah disepakati saat ditelepon.
 */
export async function createManualTourRequest(
  input: unknown,
): Promise<ActionResult<{ id: string; requestCode: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = manualTourRequestSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;

  // Namanya diambil dari data paket, bukan dari kiriman form — supaya yang
  // tersimpan tetap nama paket sebenarnya sekalipun formnya diubah orang.
  const tour = getTourBySlug(data.tourSlug);
  if (!tour) return fail('Paket tidak ditemukan.');

  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });

  const requestCode = generateBookingCode(new Date());

  const [row] = await db
    .insert(tourRequests)
    .values({
      requestCode,
      tourSlug: tour.slug,
      tourNameSnapshot: tour.name.id,
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      email: data.email || null,
      customerId,
      pax: data.pax,
      startDate: data.startDate,
      endDate: data.endDate || null,
      notes: data.notes || null,
      adminNotes: data.adminNotes || null,
      status: data.status,
      source: 'manual',
    })
    .returning({ id: tourRequests.id });

  revalidatePath('/permintaan-tur');
  revalidatePath('/');
  await catatAktivitas({
    aksi: 'tur.buat',
    ringkasan: `Mencatat permintaan tur manual ${requestCode}`,
  });

  return ok({ id: row.id, requestCode });
}

/** Mencatat permintaan tiket yang masuk lewat telepon. Lihat catatan di atas. */
export async function createManualTicketRequest(
  input: unknown,
): Promise<ActionResult<{ id: string; requestCode: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = manualTicketRequestSchema.safeParse(input);
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

  const [row] = await db
    .insert(ticketRequests)
    .values({
      requestCode,
      origin: data.origin,
      destination: data.destination,
      airline: data.airline || null,
      departureDate: data.departureDate,
      returnDate: data.returnDate || null,
      pax: data.pax,
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      email: data.email || null,
      customerId,
      notes: data.notes || null,
      adminNotes: data.adminNotes || null,
      status: data.status,
      source: 'manual',
    })
    .returning({ id: ticketRequests.id });

  revalidatePath('/permintaan-tiket');
  revalidatePath('/');
  await catatAktivitas({
    aksi: 'tiket.buat',
    ringkasan: `Mencatat permintaan tiket manual ${requestCode}`,
  });

  return ok({ id: row.id, requestCode });
}
