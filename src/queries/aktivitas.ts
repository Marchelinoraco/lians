import { desc, eq, and, gte, lte, type SQL } from 'drizzle-orm';
import { db } from '@/db';
import { activityLog } from '@/db/schema';
import { requireSuperAdmin } from '@/actions/auth-guard';

export type FilterAktivitas = {
  userId?: string;
  dari?: string;
  sampai?: string;
  batas?: number;
};

/**
 * Riwayat perubahan, terbaru lebih dulu.
 *
 * Penjaga perannya ada DI DALAM fungsi ini, bukan hanya di halamannya — pola
 * yang sama dengan angka rekap dan daftar akun. Riwayat memuat siapa mengubah
 * apa di seluruh sistem; membocorkannya lewat halaman baru yang lupa memasang
 * penjaga akan lebih merugikan daripada bocornya salah satu data aslinya.
 */
export async function getAktivitas(filter: FilterAktivitas = {}) {
  await requireSuperAdmin();

  const syarat: SQL[] = [];
  if (filter.userId) syarat.push(eq(activityLog.userId, filter.userId));
  if (filter.dari) syarat.push(gte(activityLog.createdAt, new Date(`${filter.dari}T00:00:00Z`)));
  if (filter.sampai) syarat.push(lte(activityLog.createdAt, new Date(`${filter.sampai}T23:59:59Z`)));

  return db
    .select()
    .from(activityLog)
    .where(syarat.length ? and(...syarat) : undefined)
    // Dibatasi: riwayat "semua perubahan data" tumbuh terus, dan halaman yang
    // memuat sepuluh ribu baris sekaligus berhenti dapat dibuka jauh sebelum
    // datanya berhenti berguna.
    .limit(filter.batas ?? 200)
    .orderBy(desc(activityLog.createdAt));
}

/** Email pelaku yang pernah tercatat, untuk pilihan penyaring. */
export async function getPelakuAktivitas() {
  await requireSuperAdmin();

  return db
    .selectDistinctOn([activityLog.userId], {
      userId: activityLog.userId,
      email: activityLog.userEmailSnapshot,
    })
    .from(activityLog)
    .orderBy(activityLog.userId);
}
