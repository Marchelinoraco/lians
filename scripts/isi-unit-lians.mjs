import { neon } from '@neondatabase/serverless';

/**
 * Memasukkan kendaraan fisik milik LIANS, satu baris per nomor polisi.
 *
 * B 7681 BDB sengaja muncul dua kali, pada bus dan pada Hiace Premio.
 * Pemiliknya menegaskan keduanya kendaraan yang berbeda meski nomornya tercatat
 * sama, dan batasan unik di tabel memang dipasang per model justru untuk ini.
 * Bila kelak ternyata salah catat, yang perlu diperbaiki hanya satu barisnya.
 *
 * Aman diulang: dicocokkan lewat nomor polisi dan model.
 *
 * Jalankan: node --env-file=.env.local scripts/isi-unit-lians.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const UNIT = [
  ['bus-pariwisata-31-seat', ['B 7195 QF', 'B 7546 WAA', 'B 7567 WAA', 'B 7030 EAA', 'B 7480 BK', 'B 7681 BDB', 'B 7582 AW']],
  ['hiace-premio-14-seat', ['B 7681 BDB', 'B 7188 TV']],
  ['innova-zenix-q-captain-seat', ['DB 1688 SL']],
  ['innova-zenix-g', ['DB 1988 URU', 'B 2688 UOC', 'B 1688 URX']],
  ['toyota-fortuner', ['DB 1819 WD']],
  ['toyota-avanza', ['DB 1012 RI']],
];

for (const [slug, nopol] of UNIT) {
  const [model] = await sql`select id, name from vehicles where slug = ${slug}`;
  if (!model) {
    console.error(`model ${slug} tidak ditemukan — dilewati`);
    continue;
  }

  for (const plate of nopol) {
    await sql`
      insert into fleet_units (plate, vehicle_id, vehicle_name_snapshot)
      values (${plate}, ${model.id}, ${model.name})
      on conflict on constraint fleet_units_plate_vehicle do nothing`;
  }
  console.log(`${model.name.padEnd(30)} ${nopol.length} unit`);
}

const [{ jml }] = await sql`select count(*)::int as jml from fleet_units`;
console.log(`\ntotal ${jml} unit terdaftar`);
