import { neon } from '@neondatabase/serverless';
import { v2 as cloudinary } from 'cloudinary';
import sharp from 'sharp';

/**
 * Mengisi galeri dengan enam gambar PENANDA, bukan foto sungguhan.
 *
 * Foto asli tidak dapat diambil dari internet — foto milik orang lain berhak
 * cipta, dan foto stok yang menampilkan tempat lain justru menyesatkan. Yang
 * dibuat di sini gambar bergradasi bertuliskan "CONTOH", sehingga tidak ada
 * yang mengiranya foto LIANS yang sebenarnya.
 *
 * Gantilah lewat panel admin begitu ada foto asli: admin.lians.id/galeri
 *
 * Aman dijalankan ulang: gambar dengan public_id yang sama ditimpa, dan baris
 * galeri yang sudah ada tidak digandakan.
 *
 * Jalankan: node --env-file=.env.local scripts/isi-galeri-contoh.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const FOLDER = 'lians/galeri-contoh';

const FOTO = [
  { kunci: 'armada-siap', label: 'Armada siap jalan', warna: ['#1e6fe8', '#7cc0ff'] },
  { kunci: 'serah-terima', label: 'Serah terima kendaraan', warna: ['#0f766e', '#5eead4'] },
  { kunci: 'perjalanan-minahasa', label: 'Perjalanan ke Minahasa', warna: ['#166534', '#86efac'] },
  { kunci: 'rombongan-hiace', label: 'Rombongan dengan Hiace', warna: ['#7c2d12', '#fdba74'] },
  { kunci: 'antar-jemput-bandara', label: 'Antar-jemput bandara', warna: ['#3730a3', '#a5b4fc'] },
  { kunci: 'pantai-likupang', label: 'Menuju pantai Likupang', warna: ['#0c4a6e', '#7dd3fc'] },
];

/** Membuat gambar bergradasi dengan label — jelas bukan foto. */
async function buatGambar({ label, warna }) {
  const [dari, ke] = warna;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="900">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${dari}"/>
      <stop offset="100%" stop-color="${ke}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="900" fill="url(#g)"/>
  <text x="600" y="420" font-family="Helvetica, Arial, sans-serif" font-size="58"
        font-weight="700" fill="#ffffff" text-anchor="middle">${label}</text>
  <text x="600" y="500" font-family="Helvetica, Arial, sans-serif" font-size="34"
        fill="#ffffff" fill-opacity="0.85" text-anchor="middle">CONTOH — ganti dengan foto asli</text>
</svg>`;

  return sharp(Buffer.from(svg)).jpeg({ quality: 82 }).toBuffer();
}

async function coba(fn, label) {
  for (let i = 1; i <= 5; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === 5) throw new Error(`${label} gagal setelah 5 percobaan: ${e.message}`);
      console.log(`  ${label}: percobaan ${i} gagal, mengulang…`);
      await new Promise((r) => setTimeout(r, i * 2000));
    }
  }
}

function unggah(buffer, publicId) {
  return new Promise((selesai, gagal) => {
    cloudinary.uploader
      .upload_stream({ folder: FOLDER, public_id: publicId, overwrite: true }, (err, hasil) =>
        err ? gagal(err) : selesai(hasil),
      )
      .end(buffer);
  });
}

let urutan = 0;
let dibuat = 0;
let dilewati = 0;

for (const f of FOTO) {
  const publicId = `${FOLDER}/${f.kunci}`;

  const ada = await coba(
    () => sql`select id from gallery_items where image::text like ${'%' + f.kunci + '%'}`,
    `cek ${f.kunci}`,
  );

  if (ada.length > 0) {
    console.log(`  dilewati (sudah ada): ${f.kunci}`);
    dilewati += 1;
    urutan += 10;
    continue;
  }

  const gambar = await buatGambar(f);
  const hasil = await coba(() => unggah(gambar, f.kunci), `unggah ${f.kunci}`);

  const image = [{ url: hasil.secure_url, publicId: hasil.public_id, alt: f.label }];
  const caption = { id: f.label };

  await coba(
    () => sql`
      insert into gallery_items (image, caption, is_published, sort_order)
      values (${JSON.stringify(image)}::jsonb, ${JSON.stringify(caption)}::jsonb, true, ${urutan})`,
    `menyimpan ${f.kunci}`,
  );

  console.log(`  dibuat: ${f.kunci.padEnd(24)} ${(gambar.length / 1024).toFixed(0)} KB`);
  dibuat += 1;
  urutan += 10;
}

console.log(`\n${dibuat} foto contoh dibuat, ${dilewati} dilewati.`);
console.log('Ganti lewat admin.lians.id/galeri begitu ada foto asli.');
