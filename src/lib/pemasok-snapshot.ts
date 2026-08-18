import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { supplierVehicles, suppliers } from '@/db/schema';

/**
 * Nama pemasok disalin ke dalam pesanan, bukan dibaca lewat relasi saat
 * ditampilkan: pemasok yang kelak dihapus tidak boleh membuat pesanan lama
 * kehilangan keterangan dari siapa mobilnya dipinjam.
 *
 * `null` bila kendaraannya tidak ditemukan.
 */
export async function ambilNamaPemasok(supplierVehicleId: string): Promise<string | null> {
  const [k] = await db
    .select({ pemasok: suppliers.name })
    .from(supplierVehicles)
    .innerJoin(suppliers, eq(supplierVehicles.supplierId, suppliers.id))
    .where(eq(supplierVehicles.id, supplierVehicleId))
    .limit(1);

  return k?.pemasok ?? null;
}
