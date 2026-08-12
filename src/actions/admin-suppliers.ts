'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { suppliers, supplierVehicles } from '@/db/schema';
import { supplierInputSchema, supplierVehicleInputSchema } from '@/schemas/supplier';
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

export async function createSupplier(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = supplierInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .insert(suppliers)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      isActive: parsed.data.isActive,
    })
    .returning({ id: suppliers.id });

  revalidatePath('/pemasok');
  return ok({ id: row.id });
}

export async function updateSupplier(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = supplierInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .update(suppliers)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(suppliers.id, id))
    .returning({ id: suppliers.id });

  if (!row) return fail('Pemasok tidak ditemukan.');

  revalidatePath('/pemasok');
  revalidatePath(`/pemasok/${id}`);
  return ok({ id: row.id });
}

export async function deleteSupplier(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  // Daftar kendaraannya ikut terhapus lewat cascade, tetapi pesanan menyimpan
  // nama pemasok sebagai salinan sendiri — jejak siapa yang meminjamkan
  // kendaraannya tidak hilang dari riwayat.
  const [row] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning({
    id: suppliers.id,
  });
  if (!row) return fail('Pemasok tidak ditemukan.');

  revalidatePath('/pemasok');
  return ok({ id: row.id });
}

export async function addSupplierVehicle(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = supplierVehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .insert(supplierVehicles)
    .values({
      supplierId: parsed.data.supplierId,
      name: parsed.data.name,
      notes: parsed.data.notes || null,
    })
    .returning({ id: supplierVehicles.id });

  revalidatePath(`/pemasok/${parsed.data.supplierId}`);
  return ok({ id: row.id });
}

export async function deleteSupplierVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(supplierVehicles).where(eq(supplierVehicles.id, id)).returning({
    id: supplierVehicles.id,
    supplierId: supplierVehicles.supplierId,
  });
  if (!row) return fail('Kendaraan pemasok tidak ditemukan.');

  revalidatePath(`/pemasok/${row.supplierId}`);
  return ok({ id: row.id });
}
