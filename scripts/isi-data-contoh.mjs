/**
 * Mengisi panel admin dengan data contoh supaya tampilannya bisa dinilai
 * dengan isi, bukan dengan halaman kosong.
 *
 * SEMUA yang dibuat skrip ini diberi penanda supaya dapat dihapus lagi tanpa
 * menyentuh satu pun catatan asli:
 *
 *   pesanan          booking_code diawali  LNS-CONTOH-
 *   permintaan tur   request_code diawali  TUR-CONTOH-
 *   permintaan tiket request_code diawali  TKT-CONTOH-
 *   pelanggan        email berakhiran      @contoh.invalid
 *   pemasok          notes berisi          [DATA CONTOH]
 *
 * Penghapusnya: node --env-file=.env.local scripts/hapus-data-contoh.mjs
 *
 * Yang TIDAK disentuh: kendaraan, blog, galeri, testimoni, rute, pengaturan —
 * semuanya tampil di situs publik, dan data contoh di sana akan dilihat
 * pengunjung sungguhan. Pesanan, pelanggan, pemasok, dan permintaan hanya
 * hidup di dalam panel admin.
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

/**
 * Jumlah pesanan contoh. Bawaannya sepuluh — cukup untuk melihat daftar,
 * pencarian, dan ekspor bekerja, tanpa menumpuk catatan palsu di basis data
 * yang sebentar lagi dipakai sungguhan.
 *
 * Ubah lewat argumen bila ingin lebih banyak, misalnya untuk melihat bentuk
 * grafik setahun penuh:
 *   node --env-file=.env.local scripts/isi-data-contoh.mjs 120
 */
const JUMLAH_PESANAN = Number(process.argv[2] ?? 10);
if (!Number.isInteger(JUMLAH_PESANAN) || JUMLAH_PESANAN < 1) {
  throw new Error(`Jumlah pesanan harus bilangan bulat positif, bukan "${process.argv[2]}".`);
}

/** Acak yang dapat diulang, supaya menjalankan ulang memberi bentuk yang sama. */
let benih = 20260816;
function acak() {
  benih = (benih * 1103515245 + 12345) % 2147483648;
  return benih / 2147483648;
}
const pilih = (larik) => larik[Math.floor(acak() * larik.length)];
const antara = (a, b) => a + Math.floor(acak() * (b - a + 1));

const NAMA = [
  'Andi Rumondor', 'Grace Tumbelaka', 'Rizky Mokoginta', 'Meilani Pangemanan',
  'Yosua Lengkong', 'Fitri Manoppo', 'Denny Wowor', 'Christine Sondakh',
  'Hendra Kaunang', 'Novita Rondonuwu', 'Alfa Tampi', 'Sisca Mandagi',
  'Ruben Palit', 'Anggun Wenas', 'Dedy Sumual', 'Melisa Runtuwene',
  'Ferry Katuuk', 'Silvia Tanor', 'Bram Lumanauw', 'Devi Sepang',
  'Ivan Kalalo', 'Rina Mamahit', 'Tommy Sagay', 'Olivia Waworuntu',
];

const PEMASOK = [
  { nama: 'CV Mitra Kawanua', telepon: '6281244551200' },
  { nama: 'Rental Tondano Jaya', telepon: '6281355672100' },
  { nama: 'Bitung Trans Sejahtera', telepon: '6282188730044' },
];

const KENDARAAN_PEMASOK = {
  'CV Mitra Kawanua': ['Avanza 2021 Putih', 'Xenia 2020 Silver'],
  'Rental Tondano Jaya': ['Innova Reborn 2022 Hitam', 'Hiace Commuter 2019'],
  'Bitung Trans Sejahtera': ['Fortuner 2021 Putih'],
};

const CATATAN = [
  'Jemput di Bandara Sam Ratulangi, penerbangan siang.',
  'Minta sopir yang paham rute Tomohon–Bitung.',
  'Rombongan keluarga, butuh kursi bayi.',
  'Tambah 1 hari kalau cuaca bagus untuk ke Bunaken.',
  null,
  null,
  'Pembayaran transfer, bukti dikirim lewat WhatsApp.',
];

function tanggal(d) {
  return d.toISOString().slice(0, 10);
}

async function utama() {
  const kendaraan = await sql.query(
    'select id, name, rate_lepas_kunci, rate_pelayanan from vehicles order by sort_order',
  );
  if (kendaraan.length === 0) {
    throw new Error('Belum ada kendaraan. Isi armada lebih dulu.');
  }

  // ── Pemasok ───────────────────────────────────────────────────────────────
  const idPemasok = new Map();
  const idKendaraanPemasok = [];

  for (const p of PEMASOK) {
    const [baris] = await sql.query(
      `insert into suppliers (name, phone, notes, is_active)
       values ($1, $2, $3, true) returning id`,
      [p.nama, p.telepon, '[DATA CONTOH] rekanan tempat menyewa unit tambahan saat armada penuh.'],
    );
    idPemasok.set(p.nama, baris.id);

    for (const nama of KENDARAAN_PEMASOK[p.nama]) {
      const [unit] = await sql.query(
        'insert into supplier_vehicles (supplier_id, name) values ($1, $2) returning id',
        [baris.id, nama],
      );
      idKendaraanPemasok.push({ id: unit.id, nama, pemasok: p.nama });
    }
  }
  console.log(`pemasok       : ${PEMASOK.length} (+${idKendaraanPemasok.length} kendaraan)`);

  // ── Pelanggan ─────────────────────────────────────────────────────────────
  //
  // Sekitar dua pertiga jumlah pesanan, dibatasi daftar nama yang ada. Dengan
  // satu pelanggan per pesanan tidak akan ada pelanggan berulang, padahal
  // justru pelanggan yang menyewa lagi itu yang ingin terlihat di panel.
  const jumlahPelanggan = Math.min(NAMA.length, Math.max(3, Math.ceil(JUMLAH_PESANAN * 0.7)));

  const pelanggan = [];
  for (let i = 0; i < jumlahPelanggan; i += 1) {
    const nama = NAMA[i];
    const telepon = `62812${String(30000000 + i * 137911).slice(0, 8)}`;
    const surel = `${nama.split(' ')[0].toLowerCase()}${i}@contoh.invalid`;
    const [baris] = await sql.query(
      `insert into customers (name, phone, email) values ($1, $2, $3) returning id`,
      [nama, telepon, surel],
    );
    pelanggan.push({ id: baris.id, nama, telepon, surel });
  }
  console.log(`pelanggan     : ${pelanggan.length}`);

  // ── Pesanan, tersebar 12 bulan ────────────────────────────────────────────
  //
  // Diindeks per bulan kalender, bukan per posisi dalam larik: musim ramai
  // rental di Manado jatuh pada libur sekolah Juni–Juli dan akhir tahun, dan
  // itu harus tetap jatuh di sana berapa pun bulan skrip ini dijalankan.
  // Sebaran rata membuat grafik terlihat seperti data buatan, sedangkan yang
  // ingin dilihat justru apakah grafiknya membaca musim dengan benar.
  const BOBOT_BULAN = {
    0: 6, 1: 5, 2: 7, 3: 8, 4: 9, 5: 15,
    6: 16, 7: 10, 8: 7, 9: 8, 10: 9, 11: 13,
  };

  const sekarang = new Date();

  // Dua belas bulan ke belakang, urut dari yang terlama.
  const bulanan = [];
  for (let m = 0; m < 12; m += 1) {
    bulanan.push(new Date(sekarang.getFullYear(), sekarang.getMonth() - (11 - m), 1));
  }

  // Bobot dikalikan lagi ke arah bulan terbaru. Pada jumlah kecil, sebaran
  // musim saja akan menaruh hampir semua pesanan di masa lalu, dan panel
  // dibuka dengan daftar yang seluruhnya sudah selesai — tidak ada yang
  // menunggu konfirmasi, yang justru pekerjaan sehari-harinya.
  const bobot = bulanan.map((b, m) => BOBOT_BULAN[b.getMonth()] * (1 + m * 0.35));
  const totalBobot = bobot.reduce((a, b) => a + b, 0);

  // Sisa pembagian dibawa ke bulan berikutnya, supaya jumlah akhirnya persis
  // sebanyak yang diminta — pembulatan per bulan akan meleset beberapa baris.
  const jatah = [];
  let bawa = 0;
  for (let m = 0; m < 12; m += 1) {
    const tepat = (bobot[m] / totalBobot) * JUMLAH_PESANAN + bawa;
    const bulat = Math.round(tepat);
    bawa = tepat - bulat;
    jatah.push(Math.max(0, bulat));
  }
  // Pembulatan bisa menyisakan selisih satu; ditambal di bulan terbaru.
  let selisih = JUMLAH_PESANAN - jatah.reduce((a, b) => a + b, 0);
  while (selisih !== 0) {
    const i = selisih > 0 ? 11 : jatah.findLastIndex((n) => n > 0);
    if (i < 0) break;
    jatah[i] += selisih > 0 ? 1 : -1;
    selisih += selisih > 0 ? -1 : 1;
  }

  // Bulan berjalan dijamin kebagian, dan status pesanan ditentukan umurnya —
  // tanpa jaminan ini, sepuluh pesanan bisa jatuh seluruhnya di masa lalu dan
  // panel dibuka tanpa satu pun berstatus "Menunggu". Padahal justru pesanan
  // yang menunggu konfirmasi itu pekerjaan hariannya; daftar yang semuanya
  // sudah selesai tidak menunjukkan apa pun tentang cara panel ini dipakai.
  const minimalBaru = Math.min(JUMLAH_PESANAN, Math.max(2, Math.round(JUMLAH_PESANAN * 0.2)));
  while (jatah[11] < minimalBaru) {
    // Diambil dari bulan terlama yang masih terisi, supaya jumlah totalnya tetap.
    const donor = jatah.findIndex((n, i) => n > 0 && i < 11);
    if (donor < 0) break;
    jatah[donor] -= 1;
    jatah[11] += 1;
  }

  let nomor = 0;
  let jumlah = 0;
  let belumLunas = 0;

  for (let m = 0; m < 12; m += 1) {
    const bulan = bulanan[m];
    const hariTerakhir = new Date(bulan.getFullYear(), bulan.getMonth() + 1, 0).getDate();
    // Bulan berjalan hanya terisi sampai hari ini.
    const batas = m === 11 ? sekarang.getDate() : hariTerakhir;

    for (let i = 0; i < jatah[m]; i += 1) {
      const masuk = new Date(bulan);
      // Di bulan berjalan, condongkan ke sepuluh hari terakhir: umur itulah
      // yang membuat statusnya "Menunggu" alih-alih langsung selesai.
      masuk.setDate(m === 11 ? antara(Math.max(1, batas - 10), batas) : antara(1, batas));
      masuk.setHours(antara(7, 20), antara(0, 59), 0, 0);

      const orang = pilih(pelanggan);
      const dariPemasok = acak() < 0.28;
      const unit = pilih(kendaraan);
      const unitPemasok = pilih(idKendaraanPemasok);

      const kategori = acak() < 0.55 ? 'lepas-kunci' : 'pelayanan';
      const layanan = kategori === 'lepas-kunci' ? 'self-drive' : pilih(['with-driver', 'tourism']);
      const hari = antara(1, 5);

      const mulai = new Date(masuk);
      mulai.setDate(mulai.getDate() + antara(1, 14));
      const selesai = new Date(mulai);
      selesai.setDate(selesai.getDate() + hari - 1);

      const tarif =
        (kategori === 'lepas-kunci' ? unit.rate_lepas_kunci : unit.rate_pelayanan) ??
        unit.rate_lepas_kunci ??
        500000;
      const total = tarif * hari;

      // Pesanan lama sudah tuntas; yang baru masih berjalan.
      const umurHari = Math.floor((sekarang - masuk) / 86400000);
      const status =
        umurHari > 45
          ? acak() < 0.94
            ? 'completed'
            : 'cancelled'
          : umurHari > 7
            ? pilih(['confirmed', 'completed', 'confirmed'])
            : pilih(['pending', 'pending', 'confirmed']);

      // Dibulatkan ke kelipatan 50.000: pemasok menagih angka bulat, dan
      // "Rp 3.333.585" di layar langsung terbaca sebagai angka buatan.
      const biayaPemasok = dariPemasok
        ? Math.round((total * (0.6 + acak() * 0.15)) / 50000) * 50000
        : null;
      // Yang belum dibayar hanya pesanan belakangan — utang setahun lalu yang
      // masih menggantung bukan gambaran yang wajar. Ambangnya dua bulan
      // supaya panel utang di halaman Pemasok benar-benar terisi; dengan satu
      // baris saja, bagian itu tidak menunjukkan apa pun tentang tampilannya.
      const lunas = dariPemasok ? umurHari > 60 || acak() < 0.4 : false;
      if (dariPemasok && !lunas) belumLunas += 1;

      nomor += 1;
      const kode = `LNS-CONTOH-${String(nomor).padStart(4, '0')}`;

      await sql.query(
        `insert into bookings (
           booking_code, customer_name, phone, email, customer_id,
           service_type, vehicle_id, supplier_vehicle_id, supplier_name_snapshot,
           supplier_cost, supplier_paid, vehicle_name_snapshot,
           start_date, end_date, rate_category, driver_days, total_price,
           notes, status, source, created_at, updated_at
         ) values (
           $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$21
         )`,
        [
          kode,
          orang.nama,
          orang.telepon,
          orang.surel,
          orang.id,
          layanan,
          dariPemasok ? null : unit.id,
          dariPemasok ? unitPemasok.id : null,
          dariPemasok ? unitPemasok.pemasok : null,
          biayaPemasok,
          lunas,
          dariPemasok ? unitPemasok.nama : unit.name,
          tanggal(mulai),
          tanggal(selesai),
          kategori,
          kategori === 'pelayanan' ? hari : 0,
          total,
          pilih(CATATAN),
          status,
          acak() < 0.65 ? 'website' : 'manual',
          masuk.toISOString(),
        ],
      );
      jumlah += 1;
    }
  }
  console.log(`pesanan       : ${jumlah} (${belumLunas} pemasok belum dibayar)`);

  // ── Permintaan tur dan tiket ──────────────────────────────────────────────
  const TUR = [
    ['bunaken-snorkeling-sehari', 'Bunaken Snorkeling Sehari'],
    ['tomohon-highland-sehari', 'Tomohon Highland Sehari'],
    ['likupang-pantai-paal', 'Likupang & Pantai Paal'],
    ['bukit-kasih-danau-linow', 'Bukit Kasih & Danau Linow'],
  ];
  const jumlahTur = Math.max(1, Math.round(JUMLAH_PESANAN * 0.3));
  for (let i = 0; i < jumlahTur; i += 1) {
    const orang = pilih(pelanggan);
    const [slug, nama] = pilih(TUR);
    const masuk = new Date(sekarang);
    masuk.setDate(masuk.getDate() - antara(1, 60));
    const mulai = new Date(masuk);
    mulai.setDate(mulai.getDate() + antara(7, 30));

    await sql.query(
      `insert into tour_requests (
         request_code, tour_slug, tour_name_snapshot, customer_name, phone, email,
         customer_id, pax, start_date, notes, status, source, created_at, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$13)`,
      [
        `TUR-CONTOH-${String(i + 1).padStart(3, '0')}`,
        slug,
        nama,
        orang.nama,
        orang.telepon,
        orang.surel,
        orang.id,
        antara(2, 12),
        tanggal(mulai),
        pilih(CATATAN),
        pilih(['pending', 'pending', 'confirmed', 'completed']),
        acak() < 0.6 ? 'website' : 'manual',
        masuk.toISOString(),
      ],
    );
  }

  // Kode maskapai, bukan namanya: kolom airline menyimpan kode, dan panel
  // menerjemahkannya lewat namaMaskapai(). Diisi nama lengkap, kolomnya akan
  // tampil kosong karena tidak ada kode yang cocok.
  const RUTE_UDARA = [
    ['Manado', 'Jakarta', 'garuda'],
    ['Manado', 'Surabaya', 'lion'],
    ['Jakarta', 'Manado', 'batik'],
    ['Manado', 'Denpasar', 'citilink'],
  ];
  const jumlahTiket = Math.max(1, Math.round(JUMLAH_PESANAN * 0.2));
  for (let i = 0; i < jumlahTiket; i += 1) {
    const orang = pilih(pelanggan);
    const [asal, tujuan, maskapai] = pilih(RUTE_UDARA);
    const masuk = new Date(sekarang);
    masuk.setDate(masuk.getDate() - antara(1, 40));
    const berangkat = new Date(masuk);
    berangkat.setDate(berangkat.getDate() + antara(5, 45));

    await sql.query(
      `insert into ticket_requests (
         request_code, origin, destination, airline, departure_date, pax,
         customer_name, phone, email, customer_id, notes, status, source, created_at, updated_at
       ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
      [
        `TKT-CONTOH-${String(i + 1).padStart(3, '0')}`,
        asal,
        tujuan,
        maskapai,
        tanggal(berangkat),
        antara(1, 5),
        orang.nama,
        orang.telepon,
        orang.surel,
        orang.id,
        pilih(CATATAN),
        pilih(['pending', 'confirmed', 'completed']),
        acak() < 0.6 ? 'website' : 'manual',
        masuk.toISOString(),
      ],
    );
  }
  console.log(`permintaan    : ${jumlahTur} tur, ${jumlahTiket} tiket`);

  console.log('\nSemua data contoh dapat dihapus dengan:');
  console.log('  node --env-file=.env.local scripts/hapus-data-contoh.mjs');
}

utama().catch((galat) => {
  console.error(galat);
  process.exit(1);
});
