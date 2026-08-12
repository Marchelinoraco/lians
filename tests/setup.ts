import { config } from 'dotenv';
import { beforeAll, expect } from 'vitest';
import { Agent, setGlobalDispatcher } from 'undici';
import '@testing-library/jest-dom/vitest';

// Vitest tidak membaca .env.local sendiri. Tanpa ini, tes integrasi
// akan terlewat diam-diam karena DATABASE_URL tidak terlihat.
config({ path: '.env.local', quiet: true });

/**
 * Batas koneksi bawaan Node adalah 10 detik. Menjangkau Neon di Singapura dari
 * jaringan yang sedang lambat kadang menghabiskan 9–10 detik hanya untuk
 * membuka koneksi, sehingga tes gagal di tempat yang berbeda-beda setiap kali
 * dijalankan — terlihat seperti bug, padahal hanya jaringan.
 *
 * Batasnya diperlebar khusus untuk tes. Kode produksi tidak menyentuh ini.
 */
setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

/**
 * Neon paket gratis menidurkan compute-nya saat menganggur, dan panggilan
 * pertama harus membangunkannya.
 *
 * Hanya dijalankan untuk tes integrasi. Tes unit tidak menyentuh database sama
 * sekali; menghangatkan koneksi di sana membuat tes murni ikut gagal saat
 * jaringan bermasalah — kegagalan yang tidak ada hubungannya dengan apa yang
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
