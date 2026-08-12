import { config } from 'dotenv';
import { beforeAll, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Vitest tidak membaca .env.local sendiri. Tanpa ini, tes integrasi
// akan terlewat diam-diam karena DATABASE_URL tidak terlihat.
config({ path: '.env.local', quiet: true });

/**
 * Neon paket gratis menidurkan compute-nya saat menganggur, dan panggilan
 * pertama harus membangunkannya. Pada jaringan lambat, pembangunan itu melewati
 * batas koneksi 10 detik milik undici — sehingga tes PERTAMA di setiap berkas
 * gagal sementara sisanya lulus, pola yang mudah disalahartikan sebagai bug.
 *
 * Hanya dijalankan untuk tes integrasi. Tes unit tidak menyentuh database sama
 * sekali; menghangatkan koneksi di sana membuat tes murni ikut gagal saat
 * jaringan bermasalah — kegagalan yang sepenuhnya tidak relevan dengan apa yang
 * sedang diuji.
 */
beforeAll(async () => {
  const berkas = expect.getState().testPath ?? '';
  if (!berkas.includes('/integration/')) return;
  if (!process.env.DATABASE_URL) return;

  const { neon } = await import('@neondatabase/serverless');
  const sql = neon(process.env.DATABASE_URL);

  for (let percobaan = 1; percobaan <= 4; percobaan += 1) {
    try {
      await sql`select 1`;
      return;
    } catch {
      if (percobaan === 4) throw new Error('Database tidak dapat dijangkau setelah 4 percobaan.');
      await new Promise((r) => setTimeout(r, percobaan * 2000));
    }
  }
}, 60_000);
