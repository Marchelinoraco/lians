'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { manualBookingInputSchema, nominal } from '@/schemas/manual-booking';
import { generateBookingCode } from '@/lib/booking-code';
import { ambilNamaPemasok } from '@/lib/pemasok-snapshot';
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

export async function createManualBooking(
  input: unknown,
): Promise<ActionResult<{ id: string; bookingCode: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

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

  const bookingCode = generateBookingCode(new Date());

  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode,
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      email: data.email || null,
      customerId,
      serviceType: data.serviceType,
      // Tautan ke armada hanya untuk kendaraan sendiri; nama tetap disalin
      // terpisah agar keterangan yang diketik admin tidak hilang saat mobilnya
      // kelak dihapus dari armada.
      vehicleId: dariPemasok ? null : data.vehicleId || null,
      // Unit fisik hanya untuk kendaraan sendiri: pesanan dari pemasok memakai
      // mobil yang bukan milik LIANS, dan menunjuknya ke unit sendiri akan
      // membuat unit itu tampak terpakai padahal sedang menganggur.
      fleetUnitId: dariPemasok ? null : data.fleetUnitId || null,
      vehicleNameSnapshot: data.itemName,
      startDate: data.startDate,
      endDate: data.endDate || null,
      // Harga diketik admin, tidak dihitung dari tanggal. Rincian sengaja
      // dikosongkan karena memang tidak ada rumus di baliknya untuk ditampilkan.
      totalPrice: data.totalPrice,
      priceBreakdown: null,
      supplierVehicleId: dariPemasok ? data.supplierVehicleId || null : null,
      supplierNameSnapshot,
      supplierCost: dariPemasok ? nominal(data.supplierCost) : null,
      supplierPaid: dariPemasok ? data.supplierPaid : false,
      // Biaya operasional tidak bersyarat asal kendaraan: BBM, sopir, dan tol
      // tetap keluar dari kantong LIANS meski mobilnya pinjaman dari pemasok.
      costFuel: nominal(data.costFuel),
      costDriver: nominal(data.costDriver),
      costTollParking: nominal(data.costTollParking),
      costOther: nominal(data.costOther),
      costOtherNote: data.costOtherNote || null,
      notes: data.notes || null,
      adminNotes: data.adminNotes || null,
      // Dicatat staf berarti sudah disepakati lewat telepon; tidak ada yang
      // perlu dikonfirmasi lagi seperti pada pesanan dari situs.
      status: 'confirmed',
      source: 'manual',
    })
    .returning({ id: bookings.id });

  await catatAktivitas({
    aksi: 'pesanan.buat',
    ringkasan: `Mencatat pesanan manual ${bookingCode} atas nama ${data.customerName}`,
    entitas: 'booking',
    entitasId: row.id,
  });

  revalidatePath('/booking');
  revalidatePath('/pemasok');
  revalidatePath('/');
  return ok({ id: row.id, bookingCode });
}

export async function updateSupplierPaid(
  id: string,
  lunas: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = z.boolean().safeParse(lunas);
  if (!parsed.success) return fail('Nilai status pembayaran tidak dikenal.');

  const [row] = await db
    .update(bookings)
    .set({ supplierPaid: parsed.data, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id });

  if (!row) return fail('Pesanan tidak ditemukan.');

  await catatAktivitas({
    aksi: 'pesanan.pemasok-lunas',
    ringkasan: `Menandai pembayaran ke pemasok ${parsed.data ? 'sudah' : 'belum'} lunas`,
    entitas: 'booking',
    entitasId: id,
  });

  revalidatePath('/pemasok');
  revalidatePath(`/booking/${id}`);
  return ok({ id: row.id });
}
