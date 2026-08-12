import { and, eq, gte, isNotNull, lte, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { requireSuperAdmin } from '@/actions/auth-guard';

export type Rekap = {
  jumlahPesanan: number;
  jumlahWebsite: number;
  jumlahManual: number;
  pendapatan: number;
  biayaPemasok: number;
  margin: number;
  utangBelumLunas: number;
};

/**
 * Angka keuangan untuk satu rentang tanggal, berdasarkan tanggal pesanan dibuat.
 *
 * Hanya pesanan berstatus confirmed dan completed yang dihitung sebagai
 * pendapatan: yang masih menunggu belum tentu jadi, dan yang dibatalkan jelas
 * tidak menghasilkan apa-apa.
 *
 * Penjaga peran ada di dalam fungsi ini, bukan hanya di halaman pemanggilnya.
 * Selama angka uang hanya dapat lahir dari sini, tidak ada halaman atau Server
 * Action baru yang bisa membocorkannya karena penulisnya lupa memasang penjaga.
 */
export async function hitungRekap(dari: Date, sampai: Date): Promise<Rekap> {
  await requireSuperAdmin();

  const rentang = and(gte(bookings.createdAt, dari), lte(bookings.createdAt, sampai));
  const daftar = await db.select().from(bookings).where(rentang);

  const dihitung = daftar.filter((b) => b.status === 'confirmed' || b.status === 'completed');

  const pendapatan = dihitung.reduce((n, b) => n + (b.totalPrice ?? 0), 0);
  const biayaPemasok = dihitung.reduce((n, b) => n + (b.supplierCost ?? 0), 0);

  // Utang dihitung dari seluruh pesanan yang belum lunas, tanpa batas tanggal:
  // utang tahun lalu tetap utang hari ini.
  const [utang] = await db
    .select({ total: sql<number>`coalesce(sum(${bookings.supplierCost}), 0)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.supplierPaid, false),
        isNotNull(bookings.supplierCost),
        ne(bookings.status, 'cancelled'),
      ),
    );

  return {
    jumlahPesanan: dihitung.length,
    jumlahWebsite: dihitung.filter((b) => b.source === 'website').length,
    jumlahManual: dihitung.filter((b) => b.source === 'manual').length,
    pendapatan,
    biayaPemasok,
    margin: pendapatan - biayaPemasok,
    utangBelumLunas: utang?.total ?? 0,
  };
}
