import { neon } from '@neondatabase/serverless';

/**
 * Memasukkan daftar armada LIANS beserta tarif PELAYANAN (mobil + sopir + BBM).
 *
 * Tarif lepas kunci sengaja tidak disentuh: pemiliknya mengisinya sendiri lewat
 * panel admin. Kendaraan yang belum punya tarif lepas kunci karena itu juga
 * tidak menawarkan layanan lepas kunci — menayangkan pilihan yang harganya
 * kosong hanya membuat pengunjung bertanya lewat WhatsApp untuk hal yang
 * seharusnya sudah terbaca di halaman.
 *
 * Slug kendaraan yang sudah ada dipertahankan meski namanya berubah. Slug
 * adalah alamat halamannya; menggantinya memutus tautan yang sudah tersebar
 * dan menghapus peringkat pencariannya.
 *
 * Aman diulang: dicocokkan lewat slug, yang ada diperbarui, yang belum dibuat.
 *
 * Jalankan: node --env-file=.env.local scripts/isi-armada-lians.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const FITUR_MOBIL = {
  id: ['AC dingin', 'Audio', 'Terawat'],
  en: ['Cold AC', 'Audio system', 'Well maintained'],
  zh: ['冷气充足', '音响系统', '车况良好'],
  ko: ['시원한 에어컨', '오디오', '잘 관리됨'],
};
const FITUR_BESAR = {
  id: ['AC dingin', 'Kursi reclining', 'Audio & mikrofon', 'Terawat'],
  en: ['Cold AC', 'Reclining seats', 'Audio & microphone', 'Well maintained'],
  zh: ['冷气充足', '可调节座椅', '音响与麦克风', '车况良好'],
  ko: ['시원한 에어컨', '리클라이닝 시트', '오디오 및 마이크', '잘 관리됨'],
};

const SYARAT_SOPIR = {
  id: ['Dengan sopir', 'Tarif per hari', 'Sudah termasuk sopir dan BBM'],
  en: ['With driver', 'Daily rate', 'Driver and fuel included'],
  zh: ['含司机', '按天计费', '已含司机与油费'],
  ko: ['기사 포함', '일 단위 요금', '기사와 유류비 포함'],
};
const SYARAT_CAMPUR = {
  id: ['Lepas kunci atau dengan sopir', 'Tarif per hari', 'Jaminan KTP + KK'],
  en: ['Self-drive or with driver', 'Daily rate', 'ID card + family card as deposit'],
  zh: ['自驾或含司机', '按天计费', '需押身份证与家庭卡'],
  ko: ['자차 운전 또는 기사 포함', '일 단위 요금', '신분증 + 가족관계증명서 보증'],
};

/** Rentang tahun dari tabel harga, ditambahkan sebagai keterangan fitur. */
const tahunSejak = (t) => ({
  id: `Tahun ${t} ke atas`,
  en: `Model year ${t} and up`,
  zh: `${t} 年款以上`,
  ko: `${t}년식 이상`,
});
const tahunAntara = (a, b) => ({
  id: `Tahun ${a}–${b}`,
  en: `Model year ${a}–${b}`,
  zh: `${a}–${b} 年款`,
  ko: `${a}–${b}년식`,
});

const ARMADA = [
  { slug: 'toyota-avanza', name: 'All New Avanza / Xenia', category: 'mpv', pelayanan: 750000, tahun: 2022, ket: tahunSejak(2022), seats: 7, transmission: 'automatic', fuelType: 'petrol', luggage: 2, besar: false },
  { slug: 'mitsubishi-xpander', name: 'Mitsubishi Xpander', category: 'mpv', pelayanan: 850000, tahun: 2022, ket: tahunSejak(2022), seats: 7, transmission: 'automatic', fuelType: 'petrol', luggage: 2, besar: false },
  { slug: 'innova-reborn', name: 'Innova Reborn', category: 'mpv', pelayanan: 900000, tahun: 2019, ket: tahunAntara(2019, 2022), seats: 7, transmission: 'automatic', fuelType: 'diesel', luggage: 3, besar: false },
  { slug: 'innova-zenix-g', name: 'Innova Zenix G', category: 'mpv', pelayanan: 1300000, tahun: 2023, ket: tahunSejak(2023), seats: 7, transmission: 'automatic', fuelType: 'petrol', luggage: 3, besar: false },
  { slug: 'innova-zenix-q-captain-seat', name: 'Innova Zenix Q (Captain Seat)', category: 'mpv', pelayanan: 1450000, tahun: 2023, ket: tahunSejak(2023), seats: 6, transmission: 'automatic', fuelType: 'petrol', luggage: 3, besar: false },
  { slug: 'toyota-fortuner', name: 'Fortuner', category: 'suv', pelayanan: 1650000, tahun: 2020, ket: tahunSejak(2020), seats: 7, transmission: 'automatic', fuelType: 'diesel', luggage: 3, besar: false },
  { slug: 'pajero-sport', name: 'Pajero Sport', category: 'suv', pelayanan: 1650000, tahun: 2020, ket: tahunSejak(2020), seats: 7, transmission: 'automatic', fuelType: 'diesel', luggage: 3, besar: false },
  { slug: 'toyota-alphard', name: 'Alphard Facelift', category: 'luxury', pelayanan: 3000000, tahun: 2019, ket: tahunAntara(2019, 2022), seats: 7, transmission: 'automatic', fuelType: 'petrol', luggage: 3, besar: false },
  { slug: 'hiace-commuter', name: 'Hiace Commuter', category: 'bus', pelayanan: 1400000, tahun: 2020, ket: tahunSejak(2020), seats: 15, transmission: 'manual', fuelType: 'diesel', luggage: 4, besar: true },
  { slug: 'hiace-premio-14-seat', name: 'Hiace Premio (14 Seat)', category: 'bus', pelayanan: 1800000, tahun: 2023, ket: tahunSejak(2023), seats: 14, transmission: 'manual', fuelType: 'diesel', luggage: 5, besar: true },
  { slug: 'bus-pariwisata-31-seat', name: 'Bus Pariwisata (31 Seat)', category: 'bus', pelayanan: 2000000, tahun: 2019, ket: tahunSejak(2019), seats: 31, transmission: 'manual', fuelType: 'diesel', luggage: 10, besar: true },
];

/** Tidak ada dalam daftar armada pemilik; disembunyikan, bukan dihapus. */
const DISEMBUNYIKAN = ['all-new-brio', 'toyota-rush'];

const gabung = (dasar, tambahan) =>
  Object.fromEntries(Object.keys(dasar).map((k) => [k, [...dasar[k], tambahan[k]]]));

const ada = await sql`select slug, rate_lepas_kunci from vehicles`;
const lepasKunciLama = new Map(ada.map((r) => [r.slug, r.rate_lepas_kunci]));

for (const [i, m] of ARMADA.entries()) {
  const lepasKunci = lepasKunciLama.get(m.slug) ?? null;

  // Lepas kunci hanya ditawarkan bila tarifnya sudah ada.
  const layanan = m.besar
    ? ['with-driver', 'tourism']
    : lepasKunci === null
      ? ['with-driver']
      : ['self-drive', 'with-driver'];

  const fitur = gabung(m.besar ? FITUR_BESAR : FITUR_MOBIL, m.ket);
  const syarat = layanan.includes('self-drive') ? SYARAT_CAMPUR : SYARAT_SOPIR;

  const [row] = await sql`
    insert into vehicles (
      slug, name, category, rate_pelayanan, rate_lepas_kunci, service_types,
      seats, transmission, fuel_type, year, luggage, features, rental_terms,
      status, is_published, sort_order, updated_at
    ) values (
      ${m.slug}, ${m.name}, ${m.category}, ${m.pelayanan}, ${lepasKunci},
      ${JSON.stringify(layanan)}::jsonb, ${m.seats}, ${m.transmission}, ${m.fuelType},
      ${m.tahun}, ${m.luggage}, ${JSON.stringify(fitur)}::jsonb, ${JSON.stringify(syarat)}::jsonb,
      'available', true, ${i}, now()
    )
    on conflict (slug) do update set
      name = excluded.name, category = excluded.category,
      rate_pelayanan = excluded.rate_pelayanan, service_types = excluded.service_types,
      seats = excluded.seats, transmission = excluded.transmission,
      fuel_type = excluded.fuel_type, year = excluded.year, luggage = excluded.luggage,
      features = excluded.features, rental_terms = excluded.rental_terms,
      is_published = true, sort_order = excluded.sort_order, updated_at = now()
    returning (xmax = 0) as baru`;

  console.log(`${row.baru ? 'baru  ' : 'ubah  '} ${String(i + 1).padStart(2)}. ${m.name}`);
}

for (const slug of DISEMBUNYIKAN) {
  const r = await sql`update vehicles set is_published = false, updated_at = now() where slug = ${slug} returning name`;
  if (r.length) console.log(`sembunyi  ${r[0].name}`);
}
