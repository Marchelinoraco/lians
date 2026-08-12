import { neon } from '@neondatabase/serverless';

/**
 * Mengganti penyebutan "Durasi 24 jam" dan "Durasi 12 jam" pada syarat sewa
 * kendaraan menjadi "Tarif per hari", mengikuti model harga baru.
 *
 * Teks ini tampil di halaman detail tiap kendaraan dalam empat bahasa, jadi
 * mengubah kodenya saja tidak cukup — data yang sudah tersimpan ikut diperbaiki.
 *
 * Hanya mengganti frasa yang dikenal; syarat sewa lain yang ditulis staf
 * dibiarkan apa adanya.
 *
 * Jalankan sekali: node --env-file=.env.local scripts/perbarui-syarat-sewa.mjs
 */
const sql = neon(process.env.DATABASE_URL);

/**
 * Jaringan ke Neon Singapura sedang tidak stabil dan sering melewati batas
 * koneksi 10 detik. Skrip ini aman diulang karena hanya mengganti frasa yang
 * dikenal, jadi percobaan ulang tidak merusak apa pun.
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

const GANTI = new Map([
  ['Durasi 24 jam', 'Tarif per hari'],
  ['Durasi 12 jam', 'Tarif per hari'],
  ['24-hour package', 'Daily rate'],
  ['12-hour package', 'Daily rate'],
  ['24 小时套餐', '按天计费'],
  ['12 小时套餐', '按天计费'],
  ['24시간 패키지', '일 단위 요금'],
  ['12시간 패키지', '일 단위 요금'],
  ['Include driver', 'Termasuk pengemudi dan BBM'],
  ['Driver included', 'Driver and fuel included'],
  ['含司机', '含司机与油费'],
  ['기사 포함', '기사와 연료 포함'],
]);

const kendaraan = await coba(
  () => sql`select id, name, rental_terms from vehicles`,
  'membaca kendaraan',
);
let diubah = 0;

for (const v of kendaraan) {
  const asal = v.rental_terms ?? {};
  const baru = {};
  let berubah = false;

  for (const [bahasa, daftar] of Object.entries(asal)) {
    if (!Array.isArray(daftar)) {
      baru[bahasa] = daftar;
      continue;
    }
    baru[bahasa] = daftar.map((item) => {
      const pengganti = GANTI.get(item);
      if (pengganti && pengganti !== item) {
        berubah = true;
        return pengganti;
      }
      return item;
    });
  }

  if (!berubah) continue;

  await coba(
    () =>
      sql`update vehicles set rental_terms = ${JSON.stringify(baru)}::jsonb, updated_at = now() where id = ${v.id}`,
    v.name,
  );
  console.log(`${v.name}: ${baru.id.join(' | ')}`);
  diubah += 1;
}

console.log(`\n${diubah} kendaraan diperbarui.`);
