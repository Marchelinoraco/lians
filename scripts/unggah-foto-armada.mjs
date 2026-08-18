import { v2 as cloudinary } from 'cloudinary';
import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'node:fs';

/**
 * Mengunggah foto katalog kendaraan ke Cloudinary lalu menautkannya ke armada.
 *
 * Berkas sumbernya berasal dari proyek website-rental-mobil. Isinya render
 * katalog pabrikan, bukan foto unit LIANS sendiri — pelanggan melihat mobil
 * yang bentuknya benar, tetapi bukan unit yang akan ia terima. Menggantinya
 * dengan foto sendiri kelak cukup lewat panel admin.
 *
 * Berkas di folder itu banyak yang identik dengan nama berbeda, sehingga nama
 * berkas TIDAK dapat dipercaya sebagai keterangan isinya. Pasangan di bawah
 * sudah diperiksa satu per satu dengan melihat gambarnya.
 *
 * Aman diulang: public ID-nya tetap dan overwrite dinyalakan.
 *
 * Jalankan: node --env-file=.env.local scripts/unggah-foto-armada.mjs
 */
const sql = neon(process.env.DATABASE_URL);
const MOBIL = '../website-rental-mobil/public/images/cars';

const PASANGAN = [
  ['toyota-avanza', `${MOBIL}/new-avanza.png`, 'All New Avanza / Xenia'],
  ['mitsubishi-xpander', `${MOBIL}/xpander-ultimate.webp`, 'Mitsubishi Xpander'],
  ['innova-reborn', `${MOBIL}/innova-reborn.png`, 'Innova Reborn'],
  ['innova-zenix-g', `${MOBIL}/innova-zenix-g.png`, 'Innova Zenix G'],
  // Berkas zenix-q identik dengan zenix-g; dari luar keduanya memang serupa,
  // yang membedakan hanya kursi kapten di kabin.
  ['innova-zenix-q-captain-seat', `${MOBIL}/innova-zenix-q.png`, 'Innova Zenix Q (Captain Seat)'],
  ['toyota-fortuner', `${MOBIL}/toyota-fortuner.png`, 'Fortuner'],
  ['pajero-sport', `${MOBIL}/pajero-sport.png`, 'Pajero Sport'],
  ['toyota-alphard', `${MOBIL}/alphard.png`, 'Alphard Facelift'],
  ['hiace-commuter', `${MOBIL}/hiace-commuter.png`, 'Hiace Commuter'],
  ['hiace-premio-14-seat', `${MOBIL}/hiace-premio.png`, 'Hiace Premio (14 Seat)'],
  // Busnya tidak ada di folder itu; berkasnya ditaruh terpisah oleh pemilik.
  ['bus-pariwisata-31-seat', 'assets/bus-pariwisata.jpg', 'Bus Pariwisata (31 Seat)'],
];

if (!process.env.CLOUDINARY_URL) {
  console.error('CLOUDINARY_URL belum diatur.');
  process.exit(1);
}

for (const [slug, jalur, alt] of PASANGAN) {
  readFileSync(jalur); // gagal cepat bila berkasnya tidak ada

  const publicId = `lians/kendaraan/${slug}`;
  const hasil = await cloudinary.uploader.upload(jalur, {
    public_id: publicId,
    overwrite: true,
    invalidate: true,
  });

  const gambar = [{ url: hasil.secure_url, publicId: hasil.public_id, alt }];
  const [row] = await sql`
    update vehicles set images = ${JSON.stringify(gambar)}::jsonb, updated_at = now()
    where slug = ${slug} returning name`;

  console.log(row ? `foto  ${row.name}` : `LEWAT ${slug} — kendaraannya tidak ditemukan`);
}

const kosong = await sql`
  select name from vehicles where is_published = true and jsonb_array_length(images) = 0`;
if (kosong.length) {
  console.log(`\nMasih tanpa foto: ${kosong.map((r) => r.name).join(', ')}`);
}
