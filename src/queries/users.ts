import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

/** Sengaja tidak memilih passwordHash — hash tidak pernah perlu keluar dari database. */
export async function getStaffUsers() {
  return db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
}
