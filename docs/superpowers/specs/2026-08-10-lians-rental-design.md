# LIANS — Website Rental Mobil & Panel Admin

**Tanggal:** 2026-08-10
**Status:** Disetujui untuk perencanaan implementasi

## Ringkasan

Website rental mobil untuk LIANS di Manado, terdiri dari situs publik (`lians.id`) dan panel admin (`admin.lians.id`). Seluruh konten — armada, rute travel, testimoni, teks halaman, dan kontak — dikelola lewat panel admin tanpa perlu deploy ulang. Pesanan customer tersimpan di database dan diteruskan ke WhatsApp untuk ditindaklanjuti manual.

Proyek referensi `../website-rental-mobil` dipakai sebagai acuan cakupan fitur dan gaya komponen, bukan sebagai basis kode. Referensi itu frontend-only (data mobil sebagai konstanta TypeScript, booking di localStorage) sehingga tidak bisa mendukung CRUD dari panel admin.

## Konteks Bisnis

- **Nama:** LIANS
- **Domain:** `lians.id`, panel admin di `admin.lians.id`
- **Alamat:** Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125
- **Bahasa situs publik:** Indonesia (bawaan), Inggris, Mandarin, Korea
- **Bahasa panel admin:** Indonesia saja
- **Mata uang:** IDR

**Layanan yang ditawarkan:**

1. Rental lepas kunci (tanpa sopir)
2. Rental dengan sopir
3. Bus / Hiace pariwisata
4. Antar-jemput bandara / travel

## Sasaran & Kriteria Sukses

1. Calon customer dapat menemukan halaman mobil tertentu lewat pencarian Google (tiap kendaraan punya URL yang dapat diindeks).
2. Staf dapat menambah, mengubah, dan menghapus mobil, rute, testimoni, serta mengubah nomor WhatsApp dan teks halaman tanpa bantuan developer.
3. Setiap pesanan masuk tercatat di database sebelum WhatsApp terbuka, sehingga tidak ada calon customer yang hilang.
4. Harga yang tersimpan pada pesanan tidak berubah ketika tarif diperbarui di kemudian hari.
5. Wisatawan berbahasa Inggris, Mandarin, dan Korea dapat membaca seluruh halaman publik dan memesan tanpa bantuan penerjemah.
6. Seluruh layanan berjalan pada paket gratis penyedia (di luar perpanjangan domain).

## Batasan

- **Anggaran:** semua layanan pada paket gratis. Biaya yang tetap ada: perpanjangan domain `lians.id` (~Rp 200–300rb/tahun).
- **Kepatuhan Vercel:** paket Hobby secara Ketentuan Layanan diperuntukkan bagi penggunaan non-komersial. Rental mobil bersifat komersial, sehingga secara aturan memerlukan paket Pro (~$20/bln). Risiko ini diketahui dan diterima pemilik. Arsitektur dijaga agar tidak terikat pada fitur eksklusif Vercel supaya perpindahan ke Pro atau penyedia lain tidak memerlukan penulisan ulang.
- **Tanpa pembayaran online.** Transaksi diselesaikan lewat WhatsApp dan pembayaran langsung.
- **Tanpa pengecekan ketersediaan otomatis** pada rilis pertama. Status ketersediaan diatur manual oleh staf.

## Arsitektur

Satu aplikasi Next.js 15 (App Router) melayani kedua domain. `middleware.ts` membaca hostname setiap permintaan:

- hostname diawali `admin.` → ditulis-ulang ke grup rute `(admin)`
- hostname lain → grup rute `(public)`

Middleware yang sama juga menentukan bahasa dari awalan path pada host publik:

- `lians.id/mobil` → bahasa Indonesia, ditulis-ulang ke `/id/mobil`
- `lians.id/en/mobil`, `/zh/…`, `/ko/…` → bahasa bersangkutan

`lians.id/admin` tidak dapat diakses; panel admin hanya hidup di subdomainnya. Penulisan-ulang bersifat internal sehingga URL yang dilihat pengunjung tidak berubah.

**Alasan satu aplikasi, bukan dua proyek terpisah:** tipe data dan util harga dipakai bersama oleh situs publik dan admin. Bila terpisah, perubahan bentuk data harus disalin ke dua tempat dan berisiko lupa. Satu deployment juga berarti satu set variabel lingkungan.

**Konsekuensi yang diterima:** kegagalan deployment memengaruhi kedua domain sekaligus.

### Susunan Teknologi

| Bagian | Pilihan | Catatan batas gratis |
|---|---|---|
| Framework | Next.js 15 App Router + TypeScript (strict) | — |
| Hosting | Vercel Hobby | 100 GB bandwidth/bln |
| Database | Neon Postgres | ~0,5 GB penyimpanan |
| ORM | Drizzle ORM + driver serverless Neon | gratis |
| Autentikasi | Auth.js v5, Credentials + bcrypt, sesi JWT | gratis |
| Penyimpanan gambar | Cloudinary (unsigned upload preset + tanda tangan server) | ~25 GB bandwidth/bln |
| Styling | Tailwind CSS 4 + shadcn/ui | gratis |
| Form | React Hook Form + Zod | gratis |
| Ikon | lucide-react | gratis |
| Tanggal | date-fns | gratis |
| Multibahasa | kamus TypeScript buatan sendiri (tanpa pustaka) | gratis |
| Pengujian | Vitest + Testing Library + fast-check | gratis |

**Neon dipilih di atas Supabase** karena proyek Supabase gratis dijeda setelah sekitar seminggu tanpa aktivitas — berbahaya bagi situs bisnis yang sepi di hari tertentu. Neon hanya menidurkan compute dan bangun otomatis dalam ratusan milidetik saat ada koneksi.

**Drizzle dipilih di atas Prisma** karena ukuran bundel lebih kecil dan cold start lebih cepat pada lingkungan serverless.

### Alur Data

**Membaca:** Server Component memanggil fungsi query Drizzle secara langsung. Tidak ada lapisan REST API internal — halaman katalog tidak melakukan `fetch` ke dirinya sendiri.

**Menulis:** Server Action, satu per operasi. Setiap action memvalidasi input dengan skema Zod yang sama dengan yang dipakai form di browser, lalu memanggil `revalidatePath` pada rute publik yang terpengaruh sehingga perubahan di admin langsung tampak tanpa deploy ulang.

**Bentuk kembalian Server Action** seragam:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> }
```

Bentuk seragam ini memungkinkan form menampilkan pesan error tepat di bawah input yang bersangkutan.

## Multibahasa

Situs publik tersedia dalam empat bahasa: **Indonesia** (bawaan), **Inggris**, **Mandarin**, dan **Korea**.

### Alamat halaman

Bahasa Indonesia tanpa awalan, bahasa lain memakai awalan dua huruf:

| Bahasa | Contoh URL |
|---|---|
| Indonesia | `lians.id/mobil` |
| Inggris | `lians.id/en/mobil` |
| Mandarin | `lians.id/zh/mobil` |
| Korea | `lians.id/ko/mobil` |

Pasar utama mendapat URL terpendek dan seluruh kekuatan SEO menumpuk pada satu domain. Subdomain per bahasa ditolak karena Google memperlakukan tiap subdomain sebagai situs terpisah.

**Tidak ada pengalihan otomatis** berdasarkan header `Accept-Language`. Pengalihan semacam itu membuat perayap Google mengindeks versi yang salah dan menjengkelkan pengguna Indonesia yang peramban­nya berbahasa Inggris. Sebagai gantinya, pemilih bahasa yang terlihat jelas di header.

**Panel admin hanya berbahasa Indonesia.** Penggunanya staf lokal; menerjemahkan antarmuka admin ke empat bahasa berarti melipatgandakan pekerjaan untuk pengguna yang tidak ada.

### Penyimpanan terjemahan

Kolom yang dapat diterjemahkan menyimpan objek berkunci bahasa, bukan nilai tunggal:

```ts
type Locale = 'id' | 'en' | 'zh' | 'ko';
type Localized<T> = { id: T } & Partial<Record<Locale, T>>;

// features: { id: ['AC Dingin', 'Audio'], en: ['Cold AC', 'Audio'] }
```

Bahasa Indonesia wajib ada; tiga lainnya opsional. Satu fungsi `pickLocale(value, locale)` menangani jatuh-balik di satu tempat sehingga tidak ada halaman yang perlu tahu aturannya.

Bentuk ini dipilih di atas kolom terpisah per bahasa (`features_en`, `features_zh`, …) karena menambah bahasa kelima kelak tidak memerlukan migrasi database — cukup menambah satu entri pada daftar `Locale`.

### Aturan jatuh-balik

Terjemahan yang belum diisi jatuh ke **bahasa Indonesia**, bukan disembunyikan. Halaman tidak pernah bolong, dan staf dapat menambahkan kendaraan lebih dulu lalu menerjemahkan belakangan.

### Yang diterjemahkan

`vehicles.features` · `vehicles.rentalTerms` · `travelRoutes.vehicleNote` · `travelRoutes.estimatedDuration` · `testimonials.reviewText` · pengaturan `heroTitle`, `heroSubtitle`, `aboutText`, `promoBanner`, `operatingHours` · seluruh label antarmuka.

### Yang tidak diterjemahkan

Nama kendaraan, nama kota dan bandara pada rute, nama pelanggan, nomor telepon, alamat, dan seluruh angka harga. Semuanya nama diri atau bilangan.

### Label antarmuka

Kamus berjenis kuat di `src/i18n/messages/{id,en,zh,ko}.ts`, dengan berkas Indonesia sebagai sumber kebenaran kunci:

```ts
type Messages = typeof import('./messages/id').default;
const en: Messages = { … };   // kunci yang kurang = error TypeScript
```

Label yang lupa diterjemahkan menggagalkan `npm run build`, bukan diam-diam tayang dalam bahasa campur.

Kamus ditulis sendiri alih-alih memasang `next-intl` karena middleware proyek ini sudah menangani routing hostname; menumpuk konvensi routing sebuah pustaka di atasnya menambah bagian yang bisa bertabrakan.

## Model Data

Enam tabel Postgres.

### `vehicles`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `slug` | text unik | untuk URL `/mobil/innova-zenix-g` |
| `name` | text | |
| `category` | enum | `hatchback` `sedan` `suv` `mpv` `luxury` `bus` |
| `images` | jsonb | array `{ url, publicId, alt }`, urutan pertama = gambar utama |
| `rate24h` | integer | rupiah, wajib |
| `rate12h` | integer nullable | kosong = mobil tidak dijual paket 12 jam |
| `driverFeeOverride` | integer nullable | kosong = pakai tarif global dari `siteSettings` |
| `serviceTypes` | jsonb | array: `self-drive`, `with-driver`, `tourism` |
| `seats` | integer | |
| `transmission` | enum | `manual` `automatic` |
| `fuelType` | enum | `petrol` `diesel` `electric` `hybrid` |
| `year` | integer | |
| `luggage` | integer | |
| `features` | jsonb | `Localized<string[]>` — Indonesia wajib, bahasa lain opsional |
| `rentalTerms` | jsonb | `Localized<string[]>` |
| `status` | enum | `available` `unavailable` |
| `isPublished` | boolean | |
| `sortOrder` | integer | |
| `createdAt` / `updatedAt` | timestamptz | |

`status` dan `isPublished` sengaja dipisah. `status: unavailable` berarti kendaraan tetap tampil di katalog dengan penanda "sedang tersewa" tetapi tombol booking dinonaktifkan. `isPublished: false` menyembunyikan kendaraan sepenuhnya — untuk mobil yang sedang diperbaiki atau sudah tidak dimiliki.

`driverFeeOverride` tidak dipakai pada rilis pertama (tarif sopir sama rata) tetapi disediakan agar penambahan tarif sopir per kendaraan di kemudian hari tidak memerlukan migrasi skema.

### `travelRoutes`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `origin` | text | |
| `destination` | text | |
| `price` | integer nullable | kosong → tampilkan "Hubungi untuk harga" |
| `vehicleNote` | jsonb nullable | `Localized<string>`, mis. `{ id: "Avanza / Xenia" }` |
| `estimatedDuration` | jsonb nullable | `Localized<string>`, mis. `{ id: "45 menit", en: "45 minutes" }` |
| `isPublished` | boolean | |
| `sortOrder` | integer | |
| `createdAt` / `updatedAt` | timestamptz | |

`price` boleh kosong agar staf dapat menambahkan rute baru sebelum tarifnya ditetapkan. Kartu rute menampilkan tombol WhatsApp menggantikan angka harga.

### `bookings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `bookingCode` | text unik | format `LNS-YYYYMMDD-XXXX` |
| `customerName` | text | |
| `phone` | text | |
| `email` | text nullable | |
| `serviceType` | enum | `self-drive` `with-driver` `tourism` `travel` |
| `vehicleId` | uuid nullable FK → `vehicles` | ON DELETE SET NULL |
| `routeId` | uuid nullable FK → `travelRoutes` | ON DELETE SET NULL |
| `vehicleNameSnapshot` | text nullable | nama kendaraan saat dipesan |
| `routeNameSnapshot` | text nullable | nama rute saat dipesan |
| `startDate` | date | tanggal jemput |
| `endDate` | date nullable | kosong untuk pesanan travel (sekali jalan) |
| `rateType` | enum nullable | `24h` `12h`; kosong untuk pesanan travel |
| `driverDays` | integer | 0 untuk pesanan travel dan lepas kunci tanpa sopir |
| `totalPrice` | integer nullable | hasil hitung server; kosong bila rute travel belum bertarif |
| `priceBreakdown` | jsonb | rincian beku |
| `notes` | text nullable | catatan dari customer |
| `status` | enum | `pending` `confirmed` `cancelled` `completed` |
| `adminNotes` | text nullable | |
| `createdAt` / `updatedAt` | timestamptz | |

**Harga disimpan sebagai salinan beku**, tidak dihitung ulang dari `vehicles` saat ditampilkan. Tanpa ini, kenaikan tarif akan mengubah angka pada seluruh pesanan lama dan merusak catatan keuangan. Kolom `*Snapshot` memenuhi tujuan yang sama untuk nama: pesanan tetap terbaca meski kendaraannya kelak dihapus.

`bookingCode` dipakai sebagai rujukan dalam percakapan WhatsApp antara staf dan customer.

### `testimonials`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `customerName` | text | |
| `rating` | integer | 1–5 |
| `reviewText` | jsonb | `Localized<string>`, maks. 500 karakter per bahasa |
| `vehicleName` | text nullable | |
| `date` | date | |
| `isFeatured` | boolean | tampil di beranda |
| `isPublished` | boolean | |
| `sortOrder` | integer | |
| `createdAt` / `updatedAt` | timestamptz | |

Testimoni hanya dimasukkan lewat panel admin. Tidak ada formulir ulasan publik pada rilis ini.

### `siteSettings`

Tabel kunci-nilai (`key` text PK, `value` jsonb, `updatedAt`). Kunci yang dikelola:

`whatsappNumber` · `phone` · `email` · `address` · `operatingHours` · `mapsUrl` · `heroTitle` · `heroSubtitle` · `aboutText` · `socialLinks` · `promoBanner` · `driverFeePerDay`

`driverFeePerDay` berada di sini, bukan di tiap kendaraan, karena tarif sopir sama rata untuk semua armada. Satu perubahan berlaku untuk seluruh katalog.

Lima kunci menyimpan `Localized<string>` alih-alih string biasa: `heroTitle`, `heroSubtitle`, `aboutText`, `promoBanner`, dan `operatingHours`. Sisanya — nomor, alamat, tautan, dan tarif — sama di semua bahasa.

### `users`

`id` uuid PK · `email` text unik · `passwordHash` text (bcrypt) · `name` text · `createdAt`.

Semua staf memiliki hak akses sama — tidak ada sistem peran pada rilis ini. Tidak ada pendaftaran publik; akun pertama dibuat lewat skrip seed, akun berikutnya ditambahkan dari panel admin.

## Aturan Harga

Perhitungan berada pada satu fungsi murni di `lib/pricing.ts`, terpisah dari React dan dari database. Ada dua jalur, dibedakan oleh `serviceType`.

### Jalur sewa kendaraan (`self-drive`, `with-driver`, `tourism`)

```
jumlahHari   = differenceInCalendarDays(endDate, startDate), minimum 1
tarifDipilih = rateType === '12h' ? vehicle.rate12h : vehicle.rate24h
biayaSewa    = jumlahHari × tarifDipilih
tarifSopir   = vehicle.driverFeeOverride ?? settings.driverFeePerDay
biayaSopir   = driverDays × tarifSopir
total        = biayaSewa + biayaSopir
```

**Definisi jumlah hari:** selisih hari kalender, bukan jumlah tanggal yang dilalui. Sewa 1 Agustus sampai 3 Agustus = **2 hari**, sesuai kebiasaan sewa 24 jam. Sewa yang mulai dan selesai pada tanggal sama dihitung 1 hari.

Paket 12 jam dihitung per **hari kalender** dengan tarif yang berbeda, bukan per sesi 12 jam. Sewa 3 hari paket 12 jam = 3 × `rate12h`.

Bus dan Hiace pariwisata (`tourism`) memakai rumus yang sama; keduanya adalah kendaraan biasa di tabel `vehicles` dengan `category: bus`.

`driverDays` adalah masukan tersendiri, bukan turunan dari durasi. Kasus "sewa 5 hari, sopir 3 hari" menghasilkan `5 × tarif + 3 × tarifSopir`.

### Jalur travel (`travel`)

```
total = route.price
```

Tarif rute bersifat tetap sekali jalan, tidak dikalikan hari dan tidak menerima biaya sopir (sopir sudah termasuk). Bila `route.price` kosong, pesanan tetap disimpan dengan `totalPrice` kosong dan pesan WhatsApp berbunyi "menunggu penawaran harga" — staf yang menetapkan tarifnya lewat percakapan.

### Aturan validasi

Ditegakkan pada skema Zod bersama (browser dan server):

1. `driverDays` ≥ 0 dan ≤ `jumlahHari`
2. `rateType: '12h'` ditolak bila `vehicle.rate12h` kosong
3. `endDate` harus sama dengan atau setelah `startDate`
4. `startDate` tidak boleh lebih awal dari hari ini
5. Pesanan sewa kendaraan wajib punya `vehicleId`, `endDate`, dan `rateType`
6. Pesanan travel wajib punya `routeId`, dan harus memiliki `endDate`, `rateType`, serta `driverDays` kosong atau nol
7. Nomor telepon wajib; format Indonesia (`08…` atau `+62…`)

**Total selalu dihitung ulang di server** saat pesanan disimpan. Angka yang dikirim browser hanya untuk tampilan dan tidak pernah dipercaya — form di browser dapat dimanipulasi siapa pun.

## Alur Booking

1. Customer mengisi form di `/booking` (dapat terisi otomatis lewat `?vehicle=<slug>` dari halaman detail mobil).
2. Harga tampil langsung di layar seiring perubahan input, memakai fungsi `lib/pricing.ts` yang sama.
3. Submit memanggil Server Action `createBooking`.
4. Server memvalidasi ulang, mengambil tarif terkini dari database, menghitung total, membuat `bookingCode`, dan menyimpan pesanan berstatus `pending`.
5. Server mengembalikan `bookingCode` dan tautan `wa.me` berisi ringkasan pesanan yang sudah tersusun.
6. Browser menampilkan halaman konfirmasi dan membuka WhatsApp.

Pesanan tersimpan **sebelum** WhatsApp dibuka. Bila customer mengurungkan niat mengirim chat, datanya tetap ada di panel admin dan staf dapat menghubungi balik.

## Halaman

### Publik (`lians.id`)

Seluruh rute di bawah tersedia dalam empat bahasa: tanpa awalan untuk Indonesia, dan dengan awalan `/en`, `/zh`, `/ko` untuk sisanya.

| Rute | Isi |
|---|---|
| `/` | Hero, layanan, armada unggulan, rute travel populer, testimoni pilihan, ajakan kontak |
| `/mobil` | Katalog dengan pencarian, filter kategori & rentang harga, pengurutan |
| `/mobil/[slug]` | Galeri foto, spesifikasi, fitur, syarat sewa, tarif 24/12 jam, tombol booking |
| `/travel` | Daftar rute antar-jemput dengan harga atau tombol "Hubungi untuk harga" |
| `/booking` | Form pemesanan dengan ringkasan harga langsung |
| `/testimoni` | Seluruh testimoni yang dipublikasikan |
| `/tentang` | Profil usaha dari `siteSettings` |
| `/kontak` | Alamat, peta, WhatsApp, telepon, jam operasional |

Halaman detail per kendaraan adalah tambahan terhadap proyek referensi, yang hanya memiliki kartu di dalam grid. Tanpa URL tersendiri, tidak ada halaman yang dapat diranking untuk pencarian seperti "sewa Innova Manado" dan tidak ada tautan yang dapat dikirim ke calon customer.

### Admin (`admin.lians.id`)

| Rute | Isi |
|---|---|
| `/login` | Email + password |
| `/` | Dasbor: pesanan `pending`, ringkasan bulan berjalan |
| `/armada` | Tabel kendaraan; tambah, ubah, hapus, atur urutan |
| `/booking` | Tabel pesanan; filter status, ubah status, catatan internal |
| `/rute` | CRUD rute travel |
| `/testimoni` | CRUD testimoni, penanda tampil di beranda |
| `/pengaturan` | Kontak, teks halaman, tarif sopir, banner promo, akun staf |

## Penanganan Error

- **Validasi berlapis dua.** Zod di browser untuk umpan balik seketika; Zod lagi di Server Action karena browser tidak dapat dipercaya.
- **Halaman publik memakai ISR.** Bila database sedang bangun dari tidur atau bermasalah, pengunjung tetap melihat katalog versi terakhir yang berhasil dimuat. Form booking berganti menjadi ajakan menghubungi WhatsApp. Situs tidak pernah menampilkan layar putih.
- **`error.tsx` dan `not-found.tsx`** pada tiap grup rute.
- **Pembatas laju** pada `createBooking` berbasis alamat IP, dicatat di database, untuk menahan kiriman sampah tanpa layanan berbayar.
- **Kegagalan unggah gambar** tidak membatalkan penyimpanan kendaraan; gambar dapat ditambahkan menyusul.

## SEO & Data Lokal

- `generateMetadata` per halaman, termasuk judul dan deskripsi unik per kendaraan, dalam bahasa halaman tersebut.
- `hreflang` untuk keempat bahasa plus `x-default` pada setiap halaman, sehingga Google menyajikan versi yang tepat kepada tiap pencari.
- `<html lang>` mengikuti bahasa aktif.
- Data terstruktur JSON-LD `AutoRental` berisi alamat Jalan Pomorow, jam operasional, dan rentang harga.
- `sitemap.ts` dan `robots.ts` yang dihasilkan dari database; peta situs memuat keempat versi bahasa tiap URL sehingga kendaraan baru otomatis terindeks dalam semua bahasa.
- Gambar Open Graph untuk pratinjau tautan WhatsApp.

## Desain Visual

Tema terang dengan aksen biru dari logo LIANS (sekitar `#2E8BF0`). Latar putih dan abu netral, teks gelap. Pilihan ini diambil agar logo tampil natural, kesan profesional terjaga, dan teks tetap terbaca di layar ponsel di bawah sinar matahari — kondisi umum bagi customer yang mencari rental saat bepergian.

Berbeda dari proyek referensi yang bertema gelap dengan aksen cyan dan fuchsia.

**Aset yang dibutuhkan dari pemilik:** berkas logo LIANS, sebaiknya PNG berlatar transparan dan SVG bila tersedia.

## Pengujian

Pengujian difokuskan pada bagian yang kesalahannya merugikan secara finansial atau operasional.

- **Property-based (fast-check)** untuk `lib/pricing.ts`: total tidak pernah negatif; menambah hari tidak pernah menurunkan total; `driverDays > jumlahHari` selalu ditolak; `rateType: '12h'` pada kendaraan tanpa `rate12h` selalu ditolak; total selalu sama dengan jumlah komponen rinciannya; pesanan travel selalu menghasilkan total sama dengan tarif rute tanpa dipengaruhi tanggal.
- **Unit** untuk helper tanggal, pembuat `bookingCode`, penyusun pesan WhatsApp, util filter katalog, `pickLocale`, dan pembacaan bahasa dari path.
- **Komponen** untuk form booking dan panel filter.
- **Integrasi** untuk satu alur penuh: buat kendaraan di admin → tampil di katalog publik → buat pesanan → tampil di daftar pesanan admin.

Tidak ada pengujian yang hanya memverifikasi perilaku React atau Drizzle — pengujian semacam itu menambah beban perawatan tanpa menangkap bug nyata.

## Keamanan

- Panel admin dijaga middleware Auth.js; permintaan tanpa sesi dialihkan ke `/login`.
- Kata sandi disimpan sebagai hash bcrypt. Tidak ada pendaftaran publik.
- Server Action pada admin memeriksa sesi di dalam action itu sendiri, tidak hanya mengandalkan middleware.
- Kredensial database dan Cloudinary disimpan sebagai environment variable di Vercel, tidak pernah masuk ke berkas repositori.
- Unggahan Cloudinary memakai tanda tangan dari server sehingga preset tidak dapat disalahgunakan pihak luar.

## Di Luar Cakupan Rilis Ini

Dicatat agar tidak menyusup ke dalam pekerjaan:

- Pembayaran online
- Pengecekan ketersediaan otomatis dan pencegahan tabrakan jadwal
- Akun customer dan riwayat pesanan mandiri
- Email otomatis
- Peran pengguna bertingkat di panel admin
- Panel admin multibahasa
- Terjemahan otomatis (mesin penerjemah); seluruh terjemahan diketik manual oleh staf
- Formulir ulasan publik
