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

    // bcrypt biaya 12 memang lambat — itu memang gunanya. Batas 5 detik bawaan
    // Vitest terlalu ketat untuk tes yang menghitung beberapa hash sekaligus.
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
});
