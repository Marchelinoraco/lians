import sharp from 'sharp';
import path from 'node:path';
import fs from 'node:fs';

/**
 * Menyiapkan logo klien untuk ditayangkan.
 *
 * Dua berkas dari situs PNG gratis memuat papan catur PALSU — kotak-kotak abu
 * itu piksel sungguhan, bukan transparansi. Karena berselang dua warna,
 * trim() bawaan tidak bisa memangkasnya: trim mencari tepi berwarna seragam.
 *
 * Jalankan ulang bila ada logo baru:
 *   node scripts/proses-logo-klien.mjs
 */
const ASAL = 'assets/logo-klien-asli';
const TUJUAN = 'public/clients';
const TINGGI = 128; // tinggi 1x; keluaran dibuat 2x untuk layar retina

const DAFTAR = [
  { src: 'Pertamina.png', slug: 'pertamina', potong: { left: 0, top: 0, width: 360, height: 300 } },
  { src: 'kodam_merdeka.svg', slug: 'kodam-merdeka' },
  { src: 'pt.iwip.png', slug: 'pt-iwip' },
  { src: 'P.IMIP.png', slug: 'pt-imip' },
  { src: 'AXA-Mandiri.png', slug: 'axa-mandiri' },
  { src: 'PT. Wanatiara Persada.webp', slug: 'pt-wanatiara-persada' },
  { src: 'PT.Rimba Kurnia Alam.png', slug: 'pt-rimba-kurnia-alam' },
  { src: 'Nippon-Paint-Logo.png', slug: 'nippon-paint' },
  { src: 'Bawaslu.webp', slug: 'bawaslu' },
];

/** Abu-abu terang dan putih: dua warna yang menyusun papan catur palsu. */
function latarBelakang(r, g, b) {
  const terang = (r + g + b) / 3 >= 224;
  const netral = Math.max(r, g, b) - Math.min(r, g, b) <= 14;
  return terang && netral;
}

/**
 * Membuat latar menjadi transparan lewat penelusuran dari tepi, BUKAN dengan
 * menghapus semua piksel terang.
 *
 * Bedanya penting: huruf AXA berwarna putih di dalam kotak biru. Menghapus
 * semua putih akan melubangi hurufnya. Penelusuran dari tepi berhenti begitu
 * membentur logo, sehingga bagian dalam tidak tersentuh.
 */
async function hapusLatar(buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;

  const sudahDilihat = new Uint8Array(w * h);
  const antrean = [];

  const cek = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (sudahDilihat[p]) return;
    const i = p * c;
    if (data[i + 3] === 0) { sudahDilihat[p] = 1; return; }
    if (!latarBelakang(data[i], data[i + 1], data[i + 2])) return;
    sudahDilihat[p] = 1;
    data[i + 3] = 0;
    antrean.push(p);
  };

  for (let x = 0; x < w; x++) { cek(x, 0); cek(x, h - 1); }
  for (let y = 0; y < h; y++) { cek(0, y); cek(w - 1, y); }

  while (antrean.length) {
    const p = antrean.pop();
    const x = p % w;
    const y = (p / w) | 0;
    cek(x + 1, y); cek(x - 1, y); cek(x, y + 1); cek(x, y - 1);
  }

  return sharp(data, { raw: { width: w, height: h, channels: c } }).png().toBuffer();
}

fs.mkdirSync(TUJUAN, { recursive: true });

for (const { src, slug, potong } of DAFTAR) {
  let buf = fs.readFileSync(path.join(ASAL, src));

  if (src.endsWith('.svg')) {
    buf = await sharp(buf, { density: 600 }).resize({ height: TINGGI * 2 }).png().toBuffer();
  }

  // Pemotongan dijalankan sebagai pipeline TERPISAH: menggabung extract() dan
  // trim() dalam satu rantai menghasilkan 'bad extract area'.
  if (potong) buf = await sharp(buf).extract(potong).png().toBuffer();

  buf = await hapusLatar(buf);

  const dipangkas = await sharp(buf).trim({ threshold: 1 }).toBuffer().catch(() => buf);

  const hasil = await sharp(dipangkas)
    .resize({ height: TINGGI * 2, withoutEnlargement: true, fit: 'inside' })
    // palette memangkas berkas drastis dan aman untuk logo: warnanya sedikit
    // dan berbidang rata, bukan foto bergradasi halus.
    .png({ compressionLevel: 9, palette: true, quality: 92 })
    .toBuffer({ resolveWithObject: true });

  fs.writeFileSync(path.join(TUJUAN, `${slug}.png`), hasil.data);
  console.log(`  ${slug.padEnd(24)} ${hasil.info.width}x${hasil.info.height}  ${(hasil.data.length / 1024).toFixed(1)} KB`);
}
