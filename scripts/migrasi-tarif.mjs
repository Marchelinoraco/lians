import { neon } from '@neondatabase/serverless';

/**
 * Menyalin tarif 24 jam lama menjadi tarif lepas kunci, sebagai titik awal.
 *
 * Tarif pelayanan sengaja dibiarkan kosong: nilainya keputusan bisnis, bukan
 * turunan rumus. Menebaknya berarti menayangkan harga yang salah kepada
 * pelanggan. Sampai diisi lewat panel admin, kendaraan hanya bisa dipesan
 * sebagai lepas kunci.
 *
 * Jalankan sekali: node --env-file=.env.local scripts/migrasi-tarif.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const hasil = await sql`
  update vehicles
  set rate_lepas_kunci = rate_24h
  where rate_lepas_kunci is null and rate_24h is not null
  returning name, rate_lepas_kunci`;

for (const v of hasil) console.log(`${v.name}: lepas kunci = ${v.rate_lepas_kunci}`);
console.log(`\n${hasil.length} kendaraan terisi. Tarif pelayanan harus diisi lewat panel admin.`);
