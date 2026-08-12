import { desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { customers, bookings } from '@/db/schema';

export async function getCustomers(q?: string) {
  if (!q?.trim()) return db.select().from(customers).orderBy(desc(customers.updatedAt));

  // Nomor dicari apa adanya juga, bukan hanya bentuk ternormalisasi: staf
  // biasanya mengetik potongan yang diingatnya, misalnya empat angka terakhir.
  const pola = `%${q.trim()}%`;
  return db
    .select()
    .from(customers)
    .where(or(ilike(customers.name, pola), ilike(customers.phone, pola)))
    .orderBy(desc(customers.updatedAt));
}

export async function getCustomerById(id: string) {
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row ?? null;
}

export async function getCustomerBookings(id: string) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.customerId, id))
    .orderBy(desc(bookings.createdAt));
}
