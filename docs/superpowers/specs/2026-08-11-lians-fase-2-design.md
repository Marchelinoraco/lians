# LIANS Fase 2 — Layanan Penuh, Operasi Internal, dan Konten

**Tanggal:** 2026-08-11
**Status:** Disetujui untuk perencanaan implementasi
**Membangun di atas:** `2026-08-10-lians-rental-design.md` (Fase 1, sudah tayang di lians.id)

## Ringkasan

Fase 1 membangun situs rental mobil empat bahasa dengan panel admin. Fase 2 memperluasnya menjadi situs perusahaan penuh — mencerminkan bahwa LIANS adalah biro perjalanan dengan tiga layanan, bukan penyewaan mobil saja — dan menambahkan sistem operasi internal: booking manual, data pelanggan, pemasok, serta pemisahan peran.

Company profile CV. Lian Sejahtera menjadi sumber data perusahaan: berdiri 2018, layanan tiket pesawat (mitra Garuda Indonesia, Citilink, Batik Air, Lion Air, Wings Air, Super Air Jet), paket wisata Sulawesi Utara, dan transportasi.

## Pembagian Tahap

Empat tahap berurutan. Tiap tahap harus terverifikasi sebelum berikutnya dibangun di atasnya.

| Tahap | Isi | Alasan urutan |
|---|---|---|
| 2A | Model harga baru, hitungan hari inklusif, menu baru | Menyentuh kode yang sedang tayang dan menerima pesanan |
| 2B | Peran, booking manual, master pelanggan, pemasok | Saling mengunci: pemasok butuh booking manual, keduanya butuh peran |
| 2C | Halaman Ticketing dan Tours | Layanan baru, berdiri sendiri |
| 2D | Terms, Blog, Galeri, Our Clients | Konten; paling ringan dan paling aman ditunda |

## Batasan yang Diwarisi dari Fase 1

Seluruh batasan Fase 1 tetap berlaku: paket gratis, Indonesia sebagai bahasa bawaan dengan jatuh-balik, panel admin berbahasa Indonesia saja, harga dihitung ulang di server, dan pesanan menyimpan salinan harga yang beku.

---

# Tahap 2A — Model Harga dan Menu

## Dua kategori harga per hari

Model 24 jam / 12 jam dengan biaya sopir terpisah **dihapus** dan diganti dua kategori:

| Kategori | Isi |
|---|---|
| `lepas-kunci` | Kendaraan saja, customer menyetir sendiri |
| `pelayanan` | Kendaraan + pengemudi + BBM |

Setiap kendaraan menyimpan `rateLepasKunci` dan `ratePelayanan`, keduanya integer rupiah per hari. Salah satu boleh kosong bila kendaraan itu tidak ditawarkan dalam kategori tersebut — bus pariwisata, misalnya, tidak masuk akal dilepas-kunci.

Customer memilih **satu kategori untuk seluruh sewa**. Mencampur (misal 3 hari dengan sopir, 2 hari lepas kunci) tidak didukung pada form publik; kebutuhan seperti itu ditangani lewat booking manual di Tahap 2B, tempat admin mengetik harganya sendiri.

### Perhitungan

```
jumlahHari = differenceInCalendarDays(endDate, startDate) + 1
total      = jumlahHari × tarif(kategori)
```

### Hitungan hari menjadi inklusif

15 sampai 17 dihitung **3 hari**, bukan 2. Ini kebalikan dari aturan Fase 1.

**Konsekuensi yang diterima:** setiap sewa menjadi satu hari lebih mahal dibanding perhitungan lama pada tarif yang sama. Pemilik menetapkan angka tarif barunya sendiri lewat panel admin; spesifikasi ini tidak mengandung angka tarif.

### Yang dihapus

Kolom `rate12h`, `driverFeeOverride`, pengaturan `driverFeePerDay`, tipe `RateType`, seluruh logika `driverDays`, dan tes yang menjaganya — termasuk properti "hari sopir melebihi durasi selalu ditolak" dan tes komponen peringatan hari sopir.

Kolom `bookings.rateType` dan `bookings.driverDays` **tetap ada** di skema demi pesanan lama, tetapi tidak diisi lagi oleh pesanan baru. Kolom baru `bookings.rateCategory` menyimpan kategori pesanan baru.

### Pesanan lama tidak berubah

Harga tersimpan sebagai salinan beku, jadi pesanan sebelum perubahan tetap menampilkan angka dan rincian yang disepakati saat itu — termasuk sebutan "24 jam" dan hari sopir. Itu catatan sejarah dan sengaja dibiarkan apa adanya.

## Menu baru

| Menu | Rute |
|---|---|
| Home | `/` |
| Car Rental | `/mobil` |
| Ticketing | `/tiket` |
| Tours | `/tours` |
| Testimoni | `/testimoni` |
| Tentang | `/tentang` |
| Kontak | `/kontak` |
| Terms | `/syarat-ketentuan` |

**Booking bukan menu.** Halaman `/booking` tetap ada dan diakses lewat tombol dari halaman kendaraan — alurnya memang selalu dimulai dari memilih kendaraan.

**Menu Travel dihapus.** Halaman `/travel` dihapus dan keempat rute yang ada disembunyikan dengan `isPublished: false`. Data dan tabel `travelRoutes` **tidak dibuang** agar keputusan ini dapat dibalik. Jenis layanan `travel` pada booking juga tetap ada demi pesanan lama.

---

# Tahap 2B — Operasi Internal

## Peran pengguna

Kolom `role` pada `users`: `admin` atau `super_admin`. Akun seed pertama menjadi `super_admin`.

**Satu-satunya pembatasan:** kartu rekap uang di dasbor dan halaman rekap keuangan hanya tampil untuk `super_admin`. Admin biasa tetap melihat pesanan satu per satu berikut harganya, tetap boleh mengelola armada, pemasok, pengaturan, akun staf, dan menghapus data.

Penjagaannya di dua lapis, seperti pola Fase 1: halaman memanggil penjaga peran sebelum kueri apa pun, dan Server Action yang mengembalikan angka rekap memeriksa perannya sendiri.

## Booking manual

Form terpisah di admin, berbeda perilakunya dari booking publik:

- **Tanggal mulai dan selesai hanya informasi.** Tidak dipakai menghitung apa pun.
- **Admin mengetik total harga sendiri.** Tidak ada perhitungan otomatis.
- Kolom `bookings.source`: `website` atau `manual`, sehingga rekap dapat memisahkan pesanan yang masuk lewat situs dari yang masuk lewat telepon atau tatap muka.

Alasan tanggal tidak dihitung: booking manual justru dipakai untuk kasus yang tidak muat di rumus — sewa campuran, harga negosiasi, paket khusus. Memaksakan perhitungan otomatis di sana hanya membuat admin melawan sistemnya sendiri.

## Master data pelanggan

Tabel `customers`: `id`, `name`, `phone` (unik, disimpan ternormalisasi), `email`, `notes`, timestamp.

Isinya terbentuk dari **dua arah**:

1. **Otomatis** — setiap pesanan, dari website maupun manual, mencocokkan pelanggan berdasarkan nomor telepon ternormalisasi; bila belum ada, dibuat.
2. **Manual** — admin dapat menambah dan mengubah pelanggan langsung.

Pada form booking manual, mengetik nomor telepon memunculkan saran dari daftar ini beserta nama dan emailnya.

`bookings.customerId` menunjuk ke tabel ini dan **boleh kosong** — pesanan dari Fase 1 tidak memilikinya, dan itu tidak masalah. `customerName` serta `phone` **tetap disalin ke dalam pesanan**. Alasannya sama dengan salinan harga: mengubah nama pelanggan kelak tidak boleh mengubah isi pesanan lama.

Permintaan tiket dan permintaan tur (Tahap 2C) juga mencocokkan atau membuat pelanggan dengan cara yang sama, sehingga daftar terbangun dari seluruh jalur masuk.

## Pemasok

Dua tabel:

- `suppliers`: `id`, `name`, `phone`, `notes`, `isActive`
- `supplierVehicles`: `id`, `supplierId`, `name`, `notes`

Pemasok hanya muncul pada **booking manual**. Booking dari website selalu memakai armada LIANS sendiri, karena hanya kendaraan itu yang tayang di katalog publik.

Pada booking manual, admin memilih asal kendaraan:

| Pilihan | Yang dicatat |
|---|---|
| Milik sendiri | `vehicleId` menunjuk armada LIANS |
| Dari pemasok | `supplierVehicleId`, `supplierCost`, `supplierPaid` |

`supplierCost` adalah **total** biaya yang LIANS bayar ke pemasok untuk pesanan itu — bukan per hari, dan **terpisah** dari `totalPrice` yang dibayar pelanggan. Selisihnya adalah margin.

`supplierPaid` boolean menandai lunas atau belum. Halaman Pemasok menampilkan, per pemasok, daftar pesanan yang belum dibayar beserta **total rupiahnya**. Tanpa `supplierCost`, penanda lunas hanya menghasilkan hitungan pesanan, bukan angka yang bisa ditagih — itulah alasan kedua angka disimpan.

## Rekap keuangan

Halaman khusus `super_admin`: total pendapatan per periode, jumlah pesanan terkonfirmasi, pemisahan website versus manual, total utang pemasok yang belum lunas, dan margin dari pesanan berpemasok.

---

# Tahap 2C — Ticketing dan Tours

## Ticketing

Halaman `/tiket` menampilkan enam maskapai mitra dan formulir permintaan:

| Field | Keterangan |
|---|---|
| Rute | asal dan tujuan, teks bebas |
| Maskapai | pilihan dari enam mitra, atau "belum menentukan" |
| Tanggal keberangkatan | tanggal |
| Jumlah penumpang | angka |
| Data pelanggan | nama, WhatsApp, email opsional, catatan |

Tersimpan di tabel `ticketRequests` lalu membuka WhatsApp berisi ringkasan — pola yang sama dengan booking.

**Harga tiket tidak ditampilkan.** Tarif penerbangan berubah setiap jam dan bergantung ketersediaan kelas; menampilkan angka yang langsung basi lebih merugikan daripada tidak menampilkan apa pun.

## Tours

Paket wisata sebagai entitas yang dikelola di admin. Tabel `tourPackages`:

`id`, `slug`, `name` (Localized), `description` (Localized), `itinerary` (Localized array), `pricePerPax` (nullable), `durationText` (Localized), `images` (array Cloudinary), `isPublished`, `sortOrder`, timestamp.

Halaman `/tours` menampilkan daftar paket; `/tours/[slug]` menampilkan detail dengan **galeri carousel**. `pricePerPax` boleh kosong — kartunya lalu menampilkan "Hubungi untuk harga", persis pola rute travel di Fase 1.

Formulir permintaan tur, tersimpan di `tourRequests`:

| Field | Keterangan |
|---|---|
| Paket | pilihan dari paket yang tayang |
| Jumlah peserta | angka |
| Tanggal mulai dan selesai | tanggal |
| Data pelanggan | nama, WhatsApp, email opsional, catatan |

Konten paket ditulis asli. Situs pesaing hanya boleh dipakai sebagai acuan struktur — bagian apa saja yang lazim ada pada deskripsi paket wisata — bukan disalin.

---

# Tahap 2D — Konten

## Syarat dan Ketentuan

Halaman `/syarat-ketentuan`, isinya dikelola di admin dalam empat bahasa.

**Ditulis asli.** Menyalin dari situs pesaing melanggar hak cipta, dan lebih berbahaya lagi: ketentuan mereka menggambarkan operasi mereka. Terikat pada janji yang tidak dijalankan LIANS justru merugikan saat ada sengketa.

Struktur bab mengikuti yang lazim pada penyewaan kendaraan: syarat penyewa, dokumen jaminan, wilayah pemakaian, ketentuan BBM dan tol, keterlambatan pengembalian, pembatalan, kerusakan dan kecelakaan, serta tanggung jawab para pihak.

**Isi tiap bab digali dari pemilik lewat pertanyaan sebelum ditulis.** Aturan jaminan, denda keterlambatan, batas wilayah, dan pembagian tanggung jawab kecelakaan belum diketahui dan tidak boleh dikarang.

## Blog / Berita

Tabel `posts`: `id`, `slug`, `title` (Localized), `excerpt` (Localized), `content` (Localized), `coverImage`, `publishedAt`, `isPublished`, timestamp.

Halaman `/blog` dan `/blog/[slug]`, empat bahasa, dengan `hreflang` dan masuk sitemap seperti halaman lain.

## Galeri

Tabel `galleryImages`: `id`, `image`, `caption` (Localized), `sortOrder`, `isPublished`. Ditampilkan pada halaman Testimoni.

## Our Clients

Tabel `clients`: `id`, `name`, `logo` (nullable), `sortOrder`, `isPublished`. Ditampilkan di beranda.

**Logo diunggah pemilik**, tidak diambil dari internet. Menampilkan merek terdaftar pihak lain umumnya memerlukan izin, dan instansi pemerintah serta BUMN biasanya paling ketat. Selama `logo` kosong, klien ditampilkan sebagai nama tertulis — yang untuk instansi seperti Pengadilan Tinggi dan Kodam sudah kuat sebagai bukti kepercayaan.

---

# Pengujian

Mengikuti pola Fase 1: menguji tempat yang kesalahannya merugikan uang atau operasi.

- **Property-based** untuk perhitungan harga baru: total tidak pernah negatif; menambah hari tidak pernah menurunkan total; sewa satu tanggal yang sama selalu menghasilkan 1 hari; kategori tanpa tarif selalu ditolak.
- **Unit** untuk hitungan hari inklusif (termasuk tanggal mulai sama dengan tanggal selesai), normalisasi nomor telepon pada pencocokan pelanggan, dan perhitungan utang pemasok.
- **Regresi** memastikan pesanan Fase 1 tetap terbaca setelah perubahan model harga: rincian lamanya tampil apa adanya, tanpa error, meski memakai `rateType` dan `driverDays` yang tidak dipakai lagi.
- **Integrasi** untuk: booking manual tersimpan dengan harga ketikan admin dan tanggal yang tidak memengaruhi apa pun; pelanggan tercipta otomatis dari pesanan website; pesanan berpemasok mencatat dua angka dan menandai belum lunas; admin biasa tidak menerima angka rekap sementara super admin menerima.
- **Komponen** untuk form booking baru dan form booking manual.

# Di Luar Cakupan Fase 2

- Pembayaran online
- Pengecekan ketersediaan otomatis
- Akun pelanggan mandiri
- Email otomatis
- Panel admin multibahasa
- Harga tiket pesawat otomatis dari maskapai
- Pencampuran kategori harga dalam satu pesanan lewat form publik
