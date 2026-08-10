import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { rateLimits } from '@/db/schema';

/**
 * Jendela tetap sederhana yang disimpan di Postgres.
 * Mengembalikan true bila permintaan masih dalam batas.
 *
 * Disimpan di database, bukan di memori proses, karena fungsi serverless tidak
 * berbagi memori antar-invokasi — penghitung dalam memori praktis tidak
 * membatasi apa pun di Vercel.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const kedaluwarsa = sql`${rateLimits.windowStart} < NOW() - make_interval(secs => ${windowMs / 1000})`;

  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE WHEN ${kedaluwarsa} THEN 1 ELSE ${rateLimits.count} + 1 END`,
        windowStart: sql`CASE WHEN ${kedaluwarsa} THEN NOW() ELSE ${rateLimits.windowStart} END`,
      },
    })
    .returning();

  return (row?.count ?? 1) <= limit;
}
