import { describe, it, expect, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { rateLimits } from '@/db/schema';
import { checkRateLimit } from '@/lib/rate-limit';

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const KUNCI = `uji:${Date.now()}:${Math.random().toString(36).slice(2)}`;
const KUNCI_JENDELA = `${KUNCI}:jendela`;

jalankan('checkRateLimit', () => {
  it('mengizinkan sampai batas lalu menolak sisanya', async () => {
    const hasil: boolean[] = [];
    for (let i = 0; i < 5; i += 1) {
      hasil.push(await checkRateLimit(KUNCI, 3, 60 * 60 * 1000));
    }
    expect(hasil).toEqual([true, true, true, false, false]);
  });

  it('menghitung tiap kunci secara terpisah', async () => {
    const kunciLain = `${KUNCI}:lain`;
    expect(await checkRateLimit(kunciLain, 3, 60 * 60 * 1000)).toBe(true);
    await db.delete(rateLimits).where(eq(rateLimits.key, kunciLain));
  });

  it('mengulang hitungan setelah jendela waktunya lewat', async () => {
    const SATU_JAM = 60 * 60 * 1000;

    // Jendela satu jam supaya dua panggilan berurutan pasti jatuh di jendela
    // yang sama, berapa pun lambatnya jaringan.
    expect(await checkRateLimit(KUNCI_JENDELA, 1, SATU_JAM)).toBe(true);
    expect(await checkRateLimit(KUNCI_JENDELA, 1, SATU_JAM)).toBe(false);

    // Kedaluwarsa disimulasikan dengan memundurkan window_start di database,
    // bukan dengan menunggu jam dinding: menunggu membuat hasil tes bergantung
    // pada latensi jaringan, bukan pada perilaku yang sedang diuji.
    await db
      .update(rateLimits)
      .set({ windowStart: new Date(Date.now() - 2 * SATU_JAM) })
      .where(eq(rateLimits.key, KUNCI_JENDELA));

    expect(await checkRateLimit(KUNCI_JENDELA, 1, SATU_JAM)).toBe(true);
  });
});

afterAll(async () => {
  await db.delete(rateLimits).where(eq(rateLimits.key, KUNCI));
  await db.delete(rateLimits).where(eq(rateLimits.key, KUNCI_JENDELA));
});
