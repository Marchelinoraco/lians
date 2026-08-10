import path from 'node:path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Ada package-lock.json nyasar di direktori home, dan Turbopack menebak akar
  // proyek dari berkas lock terdekat. Dikunci agar build tidak bergantung pada
  // isi folder di luar repositori.
  turbopack: { root: path.resolve(import.meta.dirname) },

};

export default nextConfig;
