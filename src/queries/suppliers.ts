import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { suppliers, supplierVehicles, bookings } from '@/db/schema';
import { berbentukUuid } from '@/lib/uuid';

export async function getSuppliers() {
  return db.select().from(suppliers).orderBy(asc(suppliers.name));
}

export async function getSupplierById(id: string) {
  if (!berbentukUuid(id)) return null;
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return row ?? null;
}

export async function getSupplierVehicles(supplierId: string) {
  if (!berbentukUuid(supplierId)) return [];
  return db
    .select()
    .from(supplierVehicles)
    .where(eq(supplierVehicles.supplierId, supplierId))
    .orderBy(asc(supplierVehicles.name));
}

/**
 * Seluruh kendaraan pemasok aktif beserta nama pemasoknya, untuk pilihan di
 * form booking manual. Pemasok yang dinonaktifkan tidak ikut: menonaktifkannya
 * memang dimaksudkan agar kendaraannya berhenti muncul sebagai pilihan.
 */
export async function getAllSupplierVehicles() {
  return db
    .select({
      id: supplierVehicles.id,
      name: supplierVehicles.name,
      supplierId: supplierVehicles.supplierId,
      supplierName: suppliers.name,
    })
    .from(supplierVehicles)
    .innerJoin(suppliers, eq(supplierVehicles.supplierId, suppliers.id))
    .where(eq(suppliers.isActive, true))
    .orderBy(asc(suppliers.name), asc(supplierVehicles.name));
}

/**
 * Pesanan yang memakai kendaraan pemasok dan belum dibayar, dikelompokkan per
 * pemasok beserta total rupiahnya.
 *
 * Pesanan yang dibatalkan tidak dihitung: LIANS tidak berutang atas pesanan
 * yang tidak jadi berjalan.
 */
export async function getUtangPemasok() {
  const baris = await db
    .select({
      supplierId: supplierVehicles.supplierId,
      supplierName: suppliers.name,
      bookingId: bookings.id,
      bookingCode: bookings.bookingCode,
      vehicleName: supplierVehicles.name,
      startDate: bookings.startDate,
      cost: bookings.supplierCost,
    })
    .from(bookings)
    .innerJoin(supplierVehicles, eq(bookings.supplierVehicleId, supplierVehicles.id))
    .innerJoin(suppliers, eq(supplierVehicles.supplierId, suppliers.id))
    .where(and(eq(bookings.supplierPaid, false), ne(bookings.status, 'cancelled')))
    .orderBy(asc(suppliers.name), asc(bookings.startDate));

  const perPemasok = new Map<
    string,
    { supplierId: string; supplierName: string; total: number; pesanan: typeof baris }
  >();

  for (const b of baris) {
    const masuk = perPemasok.get(b.supplierId) ?? {
      supplierId: b.supplierId,
      supplierName: b.supplierName,
      total: 0,
      pesanan: [] as typeof baris,
    };
    masuk.total += b.cost ?? 0;
    masuk.pesanan.push(b);
    perPemasok.set(b.supplierId, masuk);
  }

  return [...perPemasok.values()];
}
