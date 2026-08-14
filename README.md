# LIANS — Website Rental Mobil Manado

Situs publik `lians.id` dalam empat bahasa (Indonesia, Inggris, Mandarin, Korea) dan panel admin
`admin.lians.id` dalam satu aplikasi Next.js.

## Menjalankan di komputer sendiri

```bash
npm install
cp .env.example .env.local   # lalu isi nilainya, lihat bagian Variabel Lingkungan
npm run db:migrate           # membuat tabel di Neon
npm run db:seed              # data awal + akun admin pertama
npm run dev
```

- Situs publik: http://localhost:3000 (Indonesia), `/en`, `/zh`, `/ko`
- Panel admin: http://admin.localhost:3000 (Indonesia saja)

`admin.localhost` bekerja langsung di macOS dan sebagian besar Linux tanpa mengubah berkas hosts.

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi |
| `npm test` | seluruh tes |
| `npm run db:generate` | membuat berkas migrasi dari perubahan skema |
| `npm run db:migrate` | menerapkan migrasi ke database |
| `npm run db:seed` | mengisi data awal (hanya untuk database kosong) |

## Variabel Lingkungan

| Nama | Isi |
|---|---|
| `DATABASE_URL` | connection string Neon Postgres |
| `AUTH_SECRET` | acak, buat dengan `openssl rand -base64 32` |
| `CLOUDINARY_URL` | dari Dashboard Cloudinary → API Environment variable |
| `NEXT_PUBLIC_SITE_URL` | `https://lians.id` di produksi |
| `NEXT_PUBLIC_ADMIN_URL` | `https://admin.lians.id` di produksi |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | hanya dibaca oleh `db:seed` |

Cloudinary memakai **satu** variabel, bukan tiga terpisah: ketiga nilai di dalamnya dijamin cocok
satu sama lain, sehingga kesalahan `cloud_name mismatch` tidak mungkin terjadi.

## Struktur

- Menu publik: Beranda, Kendaraan, Tours, Ticketing, Blog, Syarat, Testimoni, Tentang, Kontak.
  Dengan sembilan menu, bilah atas beralih ke tombol menu di bawah 1280px — pada 1024px menu
  terakhir bertabrakan dengan pemilih bahasa.
  Halaman Travel dihapus; rutenya disembunyikan, datanya tetap utuh.
- `src/data/tours/` memuat dua belas paket wisata sebagai berkas TypeScript, satu berkas per paket,
  masing-masing lengkap empat bahasa.
- `src/proxy.ts` mengarahkan `admin.*` ke `src/app/admin`, host lain ke `src/app/[locale]`.
  Sejak Next.js 16 berkas ini bernama `proxy.ts`, dulu `middleware.ts`.
- `src/i18n/` memuat kamus keempat bahasa. Kamus Indonesia adalah sumber kebenaran bentuk, jadi
  label yang lupa diterjemahkan **menggagalkan `npm run build`**, bukan tayang setengah jadi.
- `src/lib/pricing.ts` berisi seluruh logika harga sebagai fungsi murni, tanpa React dan tanpa
  database. Diuji dengan property-based testing.
- `src/queries/` membaca database, `src/actions/` menulis. Setiap berkas di `actions/` memeriksa
  sesi sendiri.

## Keputusan yang perlu diketahui sebelum mengubah kode

**Harga: dua kategori per hari.** Lepas kunci (kendaraan saja) dan Pelayanan (kendaraan + pengemudi
+ BBM). Pelanggan memilih satu untuk seluruh sewa. Kategori yang tarifnya tidak diisi admin tidak
ditampilkan sama sekali di situs.

**Hitungan hari inklusif:** 15 sampai 17 Agustus = 3 hari. Sewa dengan tanggal mulai dan selesai yang
sama dihitung 1 hari.

**Pesanan Fase 1 memakai model lama** (24 jam / 12 jam dengan biaya sopir terpisah) dan sengaja
dibiarkan apa adanya — itu catatan sejarah. `adalahRincianLama()` di `src/db/schema.ts` membedakan
kedua bentuk rincian, dan halaman detail pesanan menampilkan keduanya dengan benar.

**Harga selalu dihitung ulang di server.** Angka yang dikirim browser hanya untuk tampilan. Ada tes
yang mengirim `totalPrice: 1` dan memastikan server mengabaikannya.

**Pesanan menyimpan salinan harga yang beku.** Menaikkan tarif tidak mengubah angka pesanan lama.
Nama kendaraan juga disalin, sehingga menghapus mobil tidak merusak riwayat pesanan.

**Terjemahan yang kosong jatuh ke bahasa Indonesia**, tidak disembunyikan. Halaman tidak pernah
bolong, dan staf bisa menambah kendaraan dulu lalu menerjemahkan belakangan.

**Setiap halaman admin memanggil `requireAdminPage()` sebelum kueri apa pun.** Redirect di layout
menghasilkan status 307 yang benar, tetapi tidak menghentikan komponen halaman dari render —
tanpa penjaga di halaman, angka ringkasan ikut terkirim dalam badan respons.

**Pesan WhatsApp selalu berbahasa Indonesia**, apa pun bahasa yang dipakai customer. Yang membaca
pesan itu staf LIANS di Manado.

**Dua peran: `admin` dan `super_admin`.** Satu-satunya beda: kartu nilai pesanan di dasbor dan
halaman Rekap Keuangan hanya untuk super admin. Admin biasa tetap melihat pesanan satu per satu
berikut harganya, dan tetap boleh mengelola armada, pelanggan, pemasok, pengaturan, serta akun staf.
Penjaganya ada di dalam `hitungRekap()` sendiri, bukan hanya di halamannya — selama angka uang hanya
lahir dari satu fungsi itu, halaman baru tidak bisa membocorkannya karena penulisnya lupa memasang
penjaga. Menaikkan sebuah akun: `node --env-file=.env.local scripts/jadikan-super-admin.mjs <email>`.

**Booking manual berbeda dari booking website.** Tanggalnya hanya keterangan — harga diketik admin,
tidak dihitung dari durasi. Itu memang gunanya: mencatat sewa campuran, harga negosiasi, dan paket
khusus yang tidak muat di rumus.

**Pemasok hanya muncul pada booking manual.** Booking dari situs selalu memakai armada LIANS sendiri,
karena hanya kendaraan itu yang tayang di katalog publik. `supplierCost` adalah total per pesanan,
bukan per hari, dan terpisah dari `totalPrice` yang dibayar pelanggan — selisihnya margin.

**Nomor telepon pelanggan disimpan ternormalisasi** (`62…`) agar `0811…` dan `+62811…` tidak
menghasilkan dua catatan untuk orang yang sama. Daftar pelanggan terisi sendiri dari setiap pesanan
yang masuk, dari situs maupun dicatat manual.

**Paket tours adalah data statis di `src/data/tours/`, bukan isi database.** Tidak ada tabel paket
dan tidak ada CRUD: mengubah paket berarti menyunting berkas dan menerbitkan ulang. Karena itu
kedua halamannya dibuat penuh saat build — 4 halaman daftar dan 48 halaman detail. Yang tersimpan di
database hanya permintaan tur yang masuk, karena itu pesanan, bukan konten.

**Paket tours tidak menampilkan harga sama sekali**, dan `TourPackage` memang tidak punya kolom
harga. Seluruh paket mengarah ke WhatsApp untuk penawaran. Dua tes menjaganya: satu menolak kolom
bernama harga, satu lagi menolak nominal rupiah di dalam teks paket.

**Isi paket wajib bersumber dari `docs/superpowers/specs/2026-08-13-data-paket-tours.md`.** LIANS
adalah reseller, jadi faktanya berasal dari operatornya — tetapi kalimat dan fotonya ditulis dan
disediakan sendiri. Jangan menambah fakta yang tidak ada di dokumen itu: halaman ini menjanjikan jam
keberangkatan dan isi paket yang harus benar-benar ditepati di lapangan.

**Terjemahan paket tours wajib lengkap empat bahasa.** Berbeda dari kendaraan yang boleh jatuh ke
bahasa Indonesia, `tests/unit/tours-data.test.ts` menggagalkan tes bila ada satu terjemahan terlewat,
dan menyebut slug serta bahasanya. Halaman setengah Indonesia setengah asing lebih buruk daripada
bolong.

**Foto tours ditaruh di `public/tours/<slug>/`** lalu nama berkasnya didaftarkan pada `images` di
berkas paketnya. Halaman tetap rapi selama daftar itu kosong.

**Blog dan Galeri dikelola di admin, berbeda dari paket Tours yang statis.** Artikel ditulis
berkala dan foto ditambah terus; meminta deploy tiap kali menulis bukan alur kerja yang masuk akal.

**Isi artikel TIDAK PERNAH dirender sebagai HTML.** Disimpan sebagai larik baris, diterjemahkan
`src/lib/blok-artikel.ts` menjadi elemen React. Hanya `## ` dan `- ` yang dikenali — bukan Markdown.
Ada tes yang memastikan `**tebal**` dan `<b>tag</b>` tampil apa adanya. Jangan menggantinya dengan
Markdown tanpa memasang penyaring HTML lebih dulu.

**Artikel baru berbawaan BELUM terbit**, kebalikan dari kendaraan, dan penyaring `isPublished` ada
di dalam kueri — bukan hanya di halaman. Tanpa itu, siapa pun yang menebak slug dapat membaca draf.

**Logo klien di `public/clients/` sudah diproses, bukan berkas mentah.** Ruang kosong di tepi
dipangkas dan tingginya diseragamkan supaya logo lebar dan logo persegi tampil dengan bobot
sebanding. Versi aslinya disimpan di `assets/logo-klien-asli/` — **di luar `public/` supaya tidak
ikut terbit**, karena salah satunya memuat watermark situs stok gambar yang sudah dipotong.
Menambah klien baru: proses berkasnya dulu, taruh di `public/clients/`, daftarkan di
`src/data/klien.ts`. Daftar itu hanya boleh berisi pelanggan yang benar-benar pernah dilayani —
logo pihak lain adalah merek dagang mereka, dan menampilkannya adalah pernyataan faktual.

**Harga tiket pesawat tidak ditampilkan dan tidak disimpan.** Tabel `ticketRequests` memang tidak
punya kolom harga: tarif penerbangan berubah setiap jam dan bergantung kelas kursi yang tersisa,
jadi angka yang tersimpan akan langsung basi. Halaman `/tiket` menjelaskan alasannya kepada
pengunjung — menyembunyikan tanpa penjelasan justru terbaca sebagai menutupi sesuatu.

**Syarat dan ketentuan ada di `src/data/syarat-ketentuan.ts`, ditulis asli, dan MENGIKAT.** Apa pun
yang tayang di halaman itu menjadi janji LIANS saat ada sengketa. Karena itu **jangan pernah
menyalin klausul dari situs penyewaan lain**: selain melanggar hak cipta, aturan milik perusahaan
lain akan mengikat LIANS pada operasi yang tidak dijalankannya — nomor rekening mereka, batas
wilayah mereka, bahkan model tarif mereka. Setiap angka di berkas itu berasal dari pemilik LIANS.
Perbarui `SYARAT_BERLAKU_SEJAK` setiap kali isinya berubah.

**Daftar maskapai statis di `src/data/maskapai.ts`, tanpa logo.** Logo maskapai adalah merek dagang
pihak lain. Maskapai juga sengaja **tidak disebut "mitra" atau "partner"** — menyebut kemitraan yang
belum tentu ada adalah klaim yang bisa dipersoalkan. Yang dipakai: "maskapai yang tiketnya dapat
kami pesankan".

## Pengujian

```bash
npm test                                   # semua
npm test -- tests/unit tests/properties tests/components   # tanpa database, ~20 detik
npm test -- tests/integration              # menyentuh database sungguhan
```

Tes integrasi otomatis dilewati bila `DATABASE_URL` tidak diatur, dan membersihkan datanya sendiri.

**Bila tes integrasi gagal di tempat yang berbeda-beda setiap kali dijalankan**, periksa latensi ke
Neon lebih dulu sebelum mencurigai kode. Neon paket gratis menidurkan compute-nya, dan jaringan yang
lambat membuat satu kueri menghabiskan puluhan detik. `tests/setup.ts` sudah menghangatkan koneksi
dan melebarkan batas waktu, tetapi jaringan yang benar-benar buruk tetap tidak bisa diselamatkan.
Tes unit, properti, dan komponen tidak menyentuh database sama sekali — kalau ketiganya lulus,
logikanya sehat.

## Yang belum dikerjakan

Tercatat di `docs/superpowers/specs/` sebagai di luar cakupan rilis ini: pembayaran online,
pengecekan ketersediaan otomatis, akun customer, email otomatis, panel admin multibahasa, dan
formulir ulasan publik.

Belum ada: pembayaran online, pengecekan ketersediaan otomatis, akun customer, email otomatis,
panel admin multibahasa, dan formulir ulasan publik.
