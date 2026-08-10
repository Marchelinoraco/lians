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
    // Jendela 1 detik: dua panggilan pertama menghabiskan batas,
    // lalu setelah jendela lewat hitungannya kembali dari nol.
    expect(await checkRateLimit(KUNCI_JENDELA, 1, 1000)).toBe(true);
    expect(await checkRateLimit(KUNCI_JENDELA, 1, 1000)).toBe(false);

    await new Promise((r) => setTimeout(r, 1300));

    expect(await checkRateLimit(KUNCI_JENDELA, 1, 1000)).toBe(true);
  });
});

afterAll(async () => {
  await db.delete(rateLimits).where(eq(rateLimits.key, KUNCI));
  await db.delete(rateLimits).where(eq(rateLimits.key, KUNCI_JENDELA));
});
