import { neon } from '@neondatabase/serverless';

/**
 * Menjadikan satu akun sebagai super admin.
 *
 * Kolom role berbawaan 'admin', jadi tanpa skrip ini tidak ada seorang pun yang
 * dapat membuka halaman rekap keuangan — termasuk pemilik.
 *
 * Jalankan: node --env-file=.env.local scripts/jadikan-super-admin.mjs admin@lians.id
 */
const email = process.argv[2];
if (!email) {
  console.error(
    'Sertakan email. Contoh: node --env-file=.env.local scripts/jadikan-super-admin.mjs admin@lians.id',
  );
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

/**
 * Jaringan ke Neon Singapura sedang tidak stabil dan sering melewati batas
 * koneksi. Skrip ini aman diulang karena hanya menetapkan satu nilai tetap.
 */
async function coba(fn, label) {
  for (let i = 1; i <= 5; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === 5) throw new Error(`${label} gagal setelah 5 percobaan: ${e.message}`);
      console.log(`  ${label}: percobaan ${i} gagal, mengulang…`);
      await new Promise((r) => setTimeout(r, i * 3000));
    }
  }
}

const hasil = await coba(
  () => sql`update users set role = 'super_admin' where email = ${email} returning email, role`,
  'menaikkan peran',
);

console.log(
  hasil.length === 0 ? `Akun ${email} tidak ditemukan.` : `${hasil[0].email} kini ${hasil[0].role}.`,
);
