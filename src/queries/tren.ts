import { gte, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema';

export type BulanTren = {
  /** Kunci YYYY-MM, dipakai sebagai id. */
  kunci: string;
  /** Label pendek untuk sumbu, misalnya "Agu". */
  label: string;
  website: number;
  manual: number;
  pendapatan: number;
};

const NAMA_BULAN = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Jumlah pesanan dan pendapatan dua belas bulan terakhir.
 *
 * Bulan tanpa pesanan tetap dikembalikan dengan angka nol. Tanpa itu, grafik
 * akan melompati bulan sepi dan memberi kesan usahanya lebih ramai daripada
 * kenyataannya — sumbu waktu yang bolong adalah salah satu cara termudah
 * berbohong lewat grafik.
 *
 * Pendapatan hanya dari pesanan terkonfirmasi dan selesai, sama dengan rekap
 * keuangan; yang masih menunggu belum tentu jadi.
 */
export async function hitungTrenBulanan(jumlahBulan = 12): Promise<BulanTren[]> {
  const awal = new Date();
  awal.setDate(1);
  awal.setHours(0, 0, 0, 0);
  awal.setMonth(awal.getMonth() - (jumlahBulan - 1));

  const baris = await db
    .select({
      kunci: sql<string>`to_char(${bookings.createdAt}, 'YYYY-MM')`,
      website: sql<number>`count(*) filter (where ${bookings.source} = 'website')::int`,
      manual: sql<number>`count(*) filter (where ${bookings.source} = 'manual')::int`,
      pendapatan: sql<number>`coalesce(sum(${bookings.totalPrice}) filter (
        where ${bookings.status} in ('confirmed','completed')
      ), 0)::int`,
    })
    .from(bookings)
    .where(gte(bookings.createdAt, awal))
    .groupBy(sql`to_char(${bookings.createdAt}, 'YYYY-MM')`);

  const perKunci = new Map(baris.map((b) => [b.kunci, b]));
  const hasil: BulanTren[] = [];

  for (let i = 0; i < jumlahBulan; i += 1) {
    const d = new Date(awal);
    d.setMonth(awal.getMonth() + i);

    const kunci = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const ada = perKunci.get(kunci);

    hasil.push({
      kunci,
      label: NAMA_BULAN[d.getMonth()],
      website: ada?.website ?? 0,
      manual: ada?.manual ?? 0,
      pendapatan: ada?.pendapatan ?? 0,
    });
  }

  return hasil;
}
