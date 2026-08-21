import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { fleetUnits, bookings, vehicles } from '@/db/schema';
import { rentangBertumpuk, type Rentang } from '@/lib/ketersediaan-unit';
import { berbentukUuid } from '@/lib/uuid';

export async function getFleetUnits() {
  return db
    .select({
      id: fleetUnits.id,
      plate: fleetUnits.plate,
      vehicleId: fleetUnits.vehicleId,
      vehicleName: fleetUnits.vehicleNameSnapshot,
      notes: fleetUnits.notes,
      isActive: fleetUnits.isActive,
    })
    .from(fleetUnits)
    .orderBy(asc(fleetUnits.vehicleNameSnapshot), asc(fleetUnits.plate));
}

export async function getFleetUnitById(id: string) {
  if (!berbentukUuid(id)) return null;
  const [row] = await db.select().from(fleetUnits).where(eq(fleetUnits.id, id)).limit(1);
  return row ?? null;
}

/** Unit aktif saja, untuk pilihan di form booking. */
export async function getFleetUnitsAktif() {
  return db
    .select({
      id: fleetUnits.id,
      plate: fleetUnits.plate,
      vehicleId: fleetUnits.vehicleId,
      vehicleName: fleetUnits.vehicleNameSnapshot,
    })
    .from(fleetUnits)
    .where(eq(fleetUnits.isActive, true))
    .orderBy(asc(fleetUnits.vehicleNameSnapshot), asc(fleetUnits.plate));
}

export type Bentrok = {
  id: string;
  bookingCode: string;
  customerName: string;
  startDate: string;
  endDate: string | null;
};

/**
 * Pesanan lain yang memakai unit ini pada tanggal yang bersinggungan.
 *
 * Penyaringan tanggal dikerjakan di memori, bukan di SQL: jumlah pesanan per
 * satu unit muat dengan mudah, dan menuliskan aturan tumpang tindih dua kali —
 * sekali sebagai SQL, sekali sebagai fungsi yang diuji — adalah cara termudah
 * membuat keduanya diam-diam berbeda.
 *
 * `kecuali` diisi saat menyunting pesanan, agar pesanan itu tidak dilaporkan
 * bentrok dengan dirinya sendiri.
 */
export async function cariBentrokUnit(
  fleetUnitId: string,
  rentang: Rentang,
  kecuali?: string,
): Promise<Bentrok[]> {
  if (!berbentukUuid(fleetUnitId)) return [];

  const calon = await db
    .select({
      id: bookings.id,
      bookingCode: bookings.bookingCode,
      customerName: bookings.customerName,
      startDate: bookings.startDate,
      endDate: bookings.endDate,
    })
    .from(bookings)
    // Pesanan yang batal tidak menahan kendaraan apa pun.
    .where(and(eq(bookings.fleetUnitId, fleetUnitId), ne(bookings.status, 'cancelled')))
    .orderBy(asc(bookings.startDate));

  return calon.filter((b) => b.id !== kecuali && rentangBertumpuk(b, rentang));
}

/** Model yang punya unit LIANS, untuk membedakannya dari model milik pemasok. */
export async function getModelDenganUnit() {
  return db
    .selectDistinct({ id: vehicles.id, name: vehicles.name })
    .from(fleetUnits)
    .innerJoin(vehicles, eq(fleetUnits.vehicleId, vehicles.id))
    .orderBy(asc(vehicles.name));
}
