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

- `src/proxy.ts` mengarahkan `admin.*` ke `src/app/admin`, host lain ke `src/app/[locale]`.
  Sejak Next.js 16 berkas ini bernama `proxy.ts`, dulu `middleware.ts`.
- `src/i18n/` memuat kamus keempat bahasa. Kamus Indonesia adalah sumber kebenaran bentuk, jadi
  label yang lupa diterjemahkan **menggagalkan `npm run build`**, bukan tayang setengah jadi.
- `src/lib/pricing.ts` berisi seluruh logika harga sebagai fungsi murni, tanpa React dan tanpa
  database. Diuji dengan property-based testing.
- `src/queries/` membaca database, `src/actions/` menulis. Setiap berkas di `actions/` memeriksa
  sesi sendiri.

## Keputusan yang perlu diketahui sebelum mengubah kode

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

## Pengujian

```bash
npm test                                   # semua
npm test -- tests/properties               # properti harga
npm test -- tests/integration              # menyentuh database sungguhan
```

Tes integrasi otomatis dilewati bila `DATABASE_URL` tidak diatur, dan membersihkan datanya sendiri.

## Yang belum dikerjakan

Tercatat di `docs/superpowers/specs/` sebagai di luar cakupan rilis ini: pembayaran online,
pengecekan ketersediaan otomatis, akun customer, email otomatis, peran pengguna bertingkat, panel
admin multibahasa, dan formulir ulasan publik.
