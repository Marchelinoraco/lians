import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,

    // Tes integrasi menyentuh satu database Neon yang sama. Dijalankan paralel,
    // berkas-berkas itu berebut koneksi dan saling mengganggu datanya, sehingga
    // kegagalannya muncul-hilang tanpa ada yang berubah di kode.
    fileParallelism: false,

    // Longgar karena dua sebab: bcrypt biaya 12 memang lambat, dan tes
    // integrasi menempuh jaringan ke Neon Singapura yang latensinya bisa
    // melonjak sampai puluhan detik. Batas ketat hanya menghasilkan kegagalan
    // acak yang tidak ada hubungannya dengan kode.
    testTimeout: 120_000,
    hookTimeout: 120_000,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
});
