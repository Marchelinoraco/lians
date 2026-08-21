'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { fleetUnits, vehicles } from '@/db/schema';
import { fleetUnitInputSchema } from '@/schemas/fleet-unit';
import { cariBentrokUnit, type Bentrok } from '@/queries/fleet-units';
import { normalisasiNopol } from '@/lib/ketersediaan-unit';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

/** Pesan yang dapat dibaca admin, menggantikan galat batasan unik dari Postgres. */
const GANDA = 'Nomor polisi itu sudah terdaftar pada model yang sama.';

function segar(id?: string) {
  revalidatePath('/kendaraan-lians');
  revalidatePath('/booking/manual');
  if (id) revalidatePath(`/kendaraan-lians/${id}`);
}

export async function createFleetUnit(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = fleetUnitInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [model] = await db
    .select({ name: vehicles.name })
    .from(vehicles)
    .where(eq(vehicles.id, parsed.data.vehicleId))
    .limit(1);
  if (!model) return fail('Model kendaraan tidak ditemukan.');

  try {
    const [row] = await db
      .insert(fleetUnits)
      .values({
        plate: normalisasiNopol(parsed.data.plate),
        vehicleId: parsed.data.vehicleId,
        vehicleNameSnapshot: model.name,
        notes: parsed.data.notes || null,
        isActive: parsed.data.isActive,
      })
      .returning({ id: fleetUnits.id });

    segar();
    return ok({ id: row.id });
  } catch {
    return fail(GANDA, { plate: [GANDA] });
  }
}

export async function updateFleetUnit(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = fleetUnitInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [model] = await db
    .select({ name: vehicles.name })
    .from(vehicles)
    .where(eq(vehicles.id, parsed.data.vehicleId))
    .limit(1);
  if (!model) return fail('Model kendaraan tidak ditemukan.');

  try {
    const [row] = await db
      .update(fleetUnits)
      .set({
        plate: normalisasiNopol(parsed.data.plate),
        vehicleId: parsed.data.vehicleId,
        vehicleNameSnapshot: model.name,
        notes: parsed.data.notes || null,
        isActive: parsed.data.isActive,
        updatedAt: new Date(),
      })
      .where(eq(fleetUnits.id, id))
      .returning({ id: fleetUnits.id });

    if (!row) return fail('Unit tidak ditemukan.');

    segar(id);
    return ok({ id: row.id });
  } catch {
    return fail(GANDA, { plate: [GANDA] });
  }
}

export async function deleteFleetUnit(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(fleetUnits).where(eq(fleetUnits.id, id)).returning({
    id: fleetUnits.id,
  });
  if (!row) return fail('Unit tidak ditemukan.');

  segar();
  return ok({ id: row.id });
}

/**
 * Memeriksa apakah unit yang dipilih sudah dipakai pada tanggal itu.
 *
 * Dipanggil form saat admin mengisi, bukan saat menyimpan: bentrok yang baru
 * ketahuan setelah tombol simpan ditekan sudah terlambat menolong — pesanannya
 * biasanya sudah disepakati lewat telepon saat itu juga.
 *
 * Tidak pernah menggagalkan penyimpanan. Kekurangan unit diselesaikan dengan
 * menyewa dari pemasok, bukan dengan menolak pesanan.
 */
export async function cekBentrokUnit(
  fleetUnitId: string,
  startDate: string,
  endDate: string | null,
  kecuali?: string,
): Promise<ActionResult<{ bentrok: Bentrok[] }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  if (!fleetUnitId || !startDate) return ok({ bentrok: [] });

  return ok({ bentrok: await cariBentrokUnit(fleetUnitId, { startDate, endDate }, kecuali) });
}
