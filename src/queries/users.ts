import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireSuperAdmin } from '@/actions/auth-guard';

/**
 * Daftar akun, hanya untuk pemilik.
 *
 * Penjaga perannya ada DI DALAM fungsi ini, bukan hanya di halaman
 * pemanggilnya — pola yang sama dengan angka rekap keuangan. Selama daftar
 * akun hanya dapat lahir dari sini, tidak ada halaman atau Server Action baru
 * yang membocorkan alamat email seluruh staf karena penulisnya lupa memasang
 * penjaga.
 *
 * Sengaja tidak memilih passwordHash — hash tidak pernah perlu keluar dari
 * database.
 */
export async function getStaffUsers() {
  await requireSuperAdmin();

  return db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
}
