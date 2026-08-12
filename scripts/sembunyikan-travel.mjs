import { neon } from '@neondatabase/serverless';

/**
 * Menyembunyikan seluruh rute travel dari situs publik tanpa menghapus datanya,
 * agar keputusan menghapus menu Travel dapat dibalik kapan saja.
 *
 * Jalankan sekali: node --env-file=.env.local scripts/sembunyikan-travel.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const hasil = await sql`
  update travel_routes set is_published = false
  where is_published = true
  returning destination`;

console.log(
  hasil.length === 0
    ? 'Tidak ada rute yang perlu disembunyikan.'
    : `${hasil.length} rute disembunyikan: ${hasil.map((r) => r.destination).join(', ')}`,
);
