export type Klien = {
  /** Nama berkas di dalam `public/clients/`. */
  slug: string;
  /** Nama resmi, dipakai sebagai teks alternatif gambar. */
  nama: string;
};

/**
 * Instansi dan perusahaan yang pernah memakai layanan LIANS.
 *
 * Logo pihak lain adalah merek dagang mereka. Menampilkannya di sini adalah
 * pernyataan faktual bahwa mereka pernah menjadi pelanggan — jadi daftar ini
 * hanya boleh berisi pelanggan yang benar-benar pernah dilayani. Jangan
 * menambahkan nama hanya karena logonya bagus.
 *
 * Berkas di `public/clients/` sudah dinormalkan: ruang kosong di tepi dipangkas
 * dan tingginya diseragamkan, supaya bobot visualnya sebanding saat berjajar.
 */
export const KLIEN: readonly Klien[] = [
  { slug: 'kodam-merdeka', nama: 'Kodam XIII/Merdeka' },
  { slug: 'pertamina', nama: 'Pertamina' },
  { slug: 'pt-imip', nama: 'PT Indonesia Morowali Industrial Park' },
  { slug: 'pt-iwip', nama: 'PT Indonesia Weda Bay Industrial Park' },
  { slug: 'axa-mandiri', nama: 'AXA Mandiri' },
  { slug: 'pt-wanatiara-persada', nama: 'PT Wanatiara Persada' },
  { slug: 'pt-rimba-kurnia-alam', nama: 'PT Rimba Kurnia Alam' },
  { slug: 'nippon-paint', nama: 'Nippon Paint' },
  { slug: 'bawaslu', nama: 'Bawaslu' },
];
