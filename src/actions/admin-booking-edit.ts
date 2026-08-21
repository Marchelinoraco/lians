'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { manualBookingInputSchema, nominal } from '@/schemas/manual-booking';
import { ambilNamaPemasok } from '@/lib/pemasok-snapshot';
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
import { normalizePhone } from '@/lib/whatsapp';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

/**
 * Mengubah pesanan yang sudah tercatat, memakai isian yang sama persis dengan
 * form booking manual.
 *
 * Berlaku untuk pesanan dari situs maupun yang dicatat staf. Yang tidak
 * disentuh di sini: status dan catatan internal — keduanya punya kendali
 * sendiri di halaman detail, dan menggandakannya di dua tempat hanya membuat
 * perubahan terakhir saling menimpa tanpa disadari.
 */
export async function updateBooking(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const [sebelum] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  if (!sebelum) return fail('Pesanan tidak ditemukan.');

  // Penjaganya di sini, bukan hanya di halaman: pesanan yang sudah selesai
  // adalah catatan keuangan yang sudah masuk rekap. Mengubahnya berarti
  // mengubah angka bulan yang sudah ditutup.
  if (sebelum.status === 'completed') {
    return fail('Pesanan yang sudah selesai tidak bisa diubah lagi.');
  }

  const parsed = manualBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;
  const dariPemasok = data.asalKendaraan === 'pemasok';

  let supplierNameSnapshot: string | null = null;
  if (dariPemasok && data.supplierVehicleId) {
    supplierNameSnapshot = await ambilNamaPemasok(data.supplierVehicleId);
    if (!supplierNameSnapshot) return fail('Kendaraan pemasok tidak ditemukan.');
  }

  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });

  // Rincian harga otomatis dari situs sengaja dibiarkan utuh; yang dicatat
  // hanya bahwa totalnya pernah diubah, supaya halaman detail dapat
  // menampilkan keduanya berdampingan.
  const hargaBerubah = sebelum.totalPrice !== data.totalPrice;
  const priceEditedAt =
    hargaBerubah && sebelum.priceBreakdown ? new Date() : sebelum.priceEditedAt;

  await db
    .update(bookings)
    .set({
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      email: data.email || null,
      customerId,
      serviceType: data.serviceType,
      vehicleId: dariPemasok ? null : data.vehicleId || null,
      // Unit fisik hanya untuk kendaraan sendiri: pesanan dari pemasok memakai
      // mobil yang bukan milik LIANS, dan menunjuknya ke unit sendiri akan
      // membuat unit itu tampak terpakai padahal sedang menganggur.
      fleetUnitId: dariPemasok ? null : data.fleetUnitId || null,
      vehicleNameSnapshot: data.itemName,
      startDate: data.startDate,
      endDate: data.endDate || null,
      totalPrice: data.totalPrice,
      priceEditedAt,
      supplierVehicleId: dariPemasok ? data.supplierVehicleId || null : null,
      supplierNameSnapshot,
      supplierCost: dariPemasok ? nominal(data.supplierCost) : null,
      supplierPaid: dariPemasok ? data.supplierPaid : false,
      costFuel: nominal(data.costFuel),
      costDriver: nominal(data.costDriver),
      costTollParking: nominal(data.costTollParking),
      costOther: nominal(data.costOther),
      costOtherNote: data.costOtherNote || null,
      notes: data.notes || null,
      adminNotes: data.adminNotes || null,
      updatedAt: new Date(),
    })
    .where(eq(bookings.id, id));

  revalidatePath('/');
  revalidatePath('/booking');
  revalidatePath(`/booking/${id}`);
  revalidatePath('/pemasok');
  return ok({ id });
}
