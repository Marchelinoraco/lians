# Tahap 2D — Blog dan Galeri

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Halaman Blog dan Galeri yang dikelola sendiri oleh LIANS lewat panel admin, tayang dalam empat bahasa, plus melengkapi sitemap yang tertinggal.

**Architecture:** Berbeda dari paket Tours yang statis di repo. Artikel ditulis berkala dan foto ditambah terus, jadi keduanya berada di database dengan CRUD di admin — meminta deploy setiap kali menulis artikel bukan alur kerja yang masuk akal. Mengikuti pola Fase 1: `queries/` membaca, `actions/` menulis dengan pemeriksaan sesi di dalam action.

**Tech Stack:** Next.js 16 · TypeScript strict · Drizzle ORM · Neon · Zod 4 · Cloudinary · Vitest

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Situs **sedang tayang**.
- Empat bahasa untuk teks yang dibaca pengunjung, dijaga `type Messages = typeof id`. Isi artikel memakai `Localized<T>` — boleh jatuh ke bahasa Indonesia bila belum diterjemahkan, seperti kendaraan, karena staf harus bisa menerbitkan dulu lalu menerjemahkan belakangan.
- Panel admin berbahasa Indonesia saja.
- **Isi artikel TIDAK PERNAH dirender sebagai HTML mentah.** Tidak ada `dangerouslySetInnerHTML` untuk isi yang diketik pengguna.
- Foto lewat Cloudinary memakai `ImageUploader` yang sudah ada.
- TypeScript `strict`, tanpa `any`. Commit tiap akhir tugas, pesan berbahasa Indonesia.

## Peta Berkas

```
src/db/schema.ts                       ← tabel posts dan galleryItems
src/schemas/post.ts                    ← BARU
src/schemas/gallery.ts                 ← BARU
src/queries/posts.ts                   ← BARU
src/queries/gallery.ts                 ← BARU
src/actions/admin-posts.ts             ← BARU
src/actions/admin-gallery.ts           ← BARU
src/lib/blok-artikel.ts                ← BARU: penerjemah blok isi artikel
src/components/blog/BlokArtikel.tsx    ← BARU
src/components/blog/PostCard.tsx       ← BARU
src/components/gallery/GaleriGrid.tsx  ← BARU
src/components/admin/PostForm.tsx      ← BARU
src/components/admin/GalleryForm.tsx   ← BARU
src/app/[locale]/blog/                 ← BARU: daftar dan detail
src/app/admin/blog/                    ← BARU
src/app/admin/galeri/                  ← BARU
src/app/[locale]/testimoni/page.tsx    ← galeri disisipkan
src/app/sitemap.ts                     ← lengkapi halaman yang tertinggal
```

---

### Task 1: Blok isi artikel

**Files:**
- Create: `src/lib/blok-artikel.ts`, `src/components/blog/BlokArtikel.tsx`
- Test: `tests/unit/blok-artikel.test.ts`

**Interfaces:**
- Produces:
  - `type Blok = { jenis: 'judul'; teks: string } | { jenis: 'paragraf'; teks: string } | { jenis: 'daftar'; butir: string[] }`
  - `uraikanBlok(baris: string[]): Blok[]` dari `@/lib/blok-artikel`
  - `<BlokArtikel baris={string[]} />`

Isi artikel disimpan sebagai larik baris, bukan satu blok teks panjang, supaya dapat memakai `LocalizedListInput` yang sudah ada — tanpa membuat widget baru dan tanpa memasang pustaka Markdown.

Tanda yang dikenali hanya dua, dan sengaja sesedikit itu:

| Awalan | Menjadi |
|---|---|
| `## ` | subjudul |
| `- ` | butir daftar (yang berurutan digabung jadi satu daftar) |
| lainnya | paragraf |

Hasilnya dirender sebagai elemen React, **bukan** HTML mentah — sehingga teks apa pun yang diketik staf tidak mungkin menjadi markup.

- [ ] **Step 1: Tulis tes yang gagal**

Create `tests/unit/blok-artikel.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { uraikanBlok } from '@/lib/blok-artikel';

describe('uraikanBlok', () => {
  it('memperlakukan baris biasa sebagai paragraf', () => {
    expect(uraikanBlok(['Halo', 'Dunia'])).toEqual([
      { jenis: 'paragraf', teks: 'Halo' },
      { jenis: 'paragraf', teks: 'Dunia' },
    ]);
  });

  it('mengenali subjudul', () => {
    expect(uraikanBlok(['## Bagian Satu'])).toEqual([{ jenis: 'judul', teks: 'Bagian Satu' }]);
  });

  it('menggabungkan butir daftar yang berurutan', () => {
    expect(uraikanBlok(['- satu', '- dua', 'penutup'])).toEqual([
      { jenis: 'daftar', butir: ['satu', 'dua'] },
      { jenis: 'paragraf', teks: 'penutup' },
    ]);
  });

  it('memisahkan dua daftar yang diselingi paragraf', () => {
    expect(uraikanBlok(['- a', 'jeda', '- b'])).toEqual([
      { jenis: 'daftar', butir: ['a'] },
      { jenis: 'paragraf', teks: 'jeda' },
      { jenis: 'daftar', butir: ['b'] },
    ]);
  });

  it('membuang baris kosong', () => {
    expect(uraikanBlok(['', '   ', 'isi'])).toEqual([{ jenis: 'paragraf', teks: 'isi' }]);
  });

  // Tanda yang tidak dikenali dibiarkan apa adanya. Isi artikel tidak boleh
  // diam-diam berubah bentuk hanya karena staf mengetik karakter tertentu.
  it('tidak menafsirkan tanda lain', () => {
    expect(uraikanBlok(['**tebal**', '<b>tag</b>', '# satu pagar'])).toEqual([
      { jenis: 'paragraf', teks: '**tebal**' },
      { jenis: 'paragraf', teks: '<b>tag</b>' },
      { jenis: 'paragraf', teks: '# satu pagar' },
    ]);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npx vitest run tests/unit/blok-artikel.test.ts`
Expected: FAIL — modul belum ada

- [ ] **Step 3: Implementasi**

Create `src/lib/blok-artikel.ts`:

```ts
export type Blok =
  | { jenis: 'judul'; teks: string }
  | { jenis: 'paragraf'; teks: string }
  | { jenis: 'daftar'; butir: string[] };

/**
 * Menerjemahkan larik baris menjadi blok yang dapat dirender.
 *
 * Hanya dua tanda yang dikenali: '## ' untuk subjudul dan '- ' untuk butir
 * daftar. Sengaja sesedikit itu — setiap tanda tambahan berarti satu cara lagi
 * isi artikel berubah bentuk di luar dugaan penulisnya.
 *
 * Tidak ada penerjemahan Markdown, dan hasilnya dirender sebagai elemen React,
 * bukan HTML. Teks apa pun yang diketik staf tidak mungkin menjadi markup.
 */
export function uraikanBlok(baris: string[]): Blok[] {
  const hasil: Blok[] = [];

  for (const mentah of baris) {
    const teks = mentah.trim();
    if (!teks) continue;

    if (teks.startsWith('## ')) {
      hasil.push({ jenis: 'judul', teks: teks.slice(3).trim() });
      continue;
    }

    if (teks.startsWith('- ')) {
      const butir = teks.slice(2).trim();
      const terakhir = hasil[hasil.length - 1];

      // Butir berurutan digabung menjadi satu daftar; begitu diselingi
      // paragraf, daftar berikutnya dimulai dari awal.
      if (terakhir?.jenis === 'daftar') terakhir.butir.push(butir);
      else hasil.push({ jenis: 'daftar', butir: [butir] });
      continue;
    }

    hasil.push({ jenis: 'paragraf', teks });
  }

  return hasil;
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npx vitest run tests/unit/blok-artikel.test.ts`
Expected: PASS, 6 tes

- [ ] **Step 5: Komponen penampil**

Create `src/components/blog/BlokArtikel.tsx` — memetakan hasil `uraikanBlok` ke `<h2>`, `<ul><li>`, dan `<p>`.

- [ ] **Step 6: Commit**

---

### Task 2: Tabel, kueri, dan Server Action

**Files:**
- Create: `src/schemas/post.ts`, `src/schemas/gallery.ts`, `src/queries/posts.ts`, `src/queries/gallery.ts`, `src/actions/admin-posts.ts`, `src/actions/admin-gallery.ts`
- Modify: `src/db/schema.ts`
- Test: `tests/integration/blog-galeri.test.ts`

**Interfaces:**
- Produces:
  - tabel `posts` dan `galleryItems`
  - `getPublishedPosts()`, `getPostBySlug(slug)`, `getAllPosts()`, `getPostById(id)`
  - `getPublishedGallery()`, `getAllGallery()`
  - `createPost`, `updatePost`, `deletePost`, `createGalleryItem`, `updateGalleryItem`, `deleteGalleryItem`

- [ ] **Step 1: Tabel**

Modify `src/db/schema.ts`:

```ts
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: jsonb('title').$type<Localized<string>>().notNull(),
  excerpt: jsonb('excerpt').$type<Localized<string>>().notNull().default({ id: '' }),
  // Larik baris, bukan satu teks panjang: bentuk ini dapat memakai
  // LocalizedListInput yang sudah ada, tanpa widget baru dan tanpa Markdown.
  body: jsonb('body').$type<Localized<string[]>>().notNull().default({ id: [] }),
  coverImage: jsonb('cover_image').$type<VehicleImage[]>().notNull().default([]),
  isPublished: boolean('is_published').notNull().default(false),
  // Tanggal terbit dipisah dari createdAt: artikel boleh disiapkan lebih dulu
  // lalu diterbitkan kemudian, dan yang tampil di situs adalah tanggal ini.
  publishedAt: date('published_at').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const galleryItems = pgTable('gallery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  image: jsonb('image').$type<VehicleImage[]>().notNull().default([]),
  caption: jsonb('caption').$type<Localized<string>>().notNull().default({ id: '' }),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Post = typeof posts.$inferSelect;
export type GalleryItem = typeof galleryItems.$inferSelect;
```

`isPublished` artikel berbawaan **false**, kebalikan dari kendaraan. Artikel setengah jadi yang tidak sengaja tayang lebih merugikan daripada artikel selesai yang lupa diterbitkan.

- [ ] **Step 2: Skema validasi**

Create `src/schemas/post.ts` — `slug` huruf kecil/angka/tanda hubung dan wajib unik (diperiksa di action), `title.id` wajib, `body.id` minimal satu baris, `publishedAt` format tanggal. Create `src/schemas/gallery.ts` — `image` tepat satu berkas, `caption` opsional.

- [ ] **Step 3: Kueri**

Create `src/queries/posts.ts` dan `src/queries/gallery.ts`. Yang publik menyaring `isPublished` dan mengurutkan `publishedAt` menurun; yang admin menampilkan semuanya.

- [ ] **Step 4: Server Action**

Create `src/actions/admin-posts.ts` dan `src/actions/admin-gallery.ts`, masing-masing memanggil `requireSession()` sendiri dan memakai `revalidatePath`.

- [ ] **Step 5: Migrasi**

```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 6: Tes integrasi**

Create `tests/integration/blog-galeri.test.ts` — menolak tanpa sesi; menolak slug kembar; artikel belum terbit tidak muncul di kueri publik; urutan berdasarkan `publishedAt` menurun; galeri terurut `sortOrder`; hapus berhasil. Bersihkan datanya di `afterAll`.

- [ ] **Step 7: Commit**

---

### Task 3: Panel admin

**Files:**
- Create: `src/components/admin/PostForm.tsx`, `src/components/admin/GalleryForm.tsx`, `src/app/admin/blog/{page,baru/page,[id]/page}.tsx`, `src/app/admin/galeri/page.tsx`
- Modify: `src/components/admin/AdminNav.tsx`

- [ ] **Step 1: Form artikel** — memakai `LocalizedTextInput` (judul, ringkasan), `LocalizedListInput` (isi), `ImageUploader` (sampul), plus slug, tanggal terbit, dan sakelar terbit. Di bawah kolom isi, tampilkan keterangan singkat: `## ` menjadi subjudul, `- ` menjadi butir daftar.

- [ ] **Step 2: Halaman blog admin** — daftar, tambah, ubah. Semuanya memanggil `requireAdminPage()` sebelum kueri apa pun.

- [ ] **Step 3: Halaman galeri admin** — satu halaman berisi kisi foto, unggah baru, ubah keterangan, hapus.

- [ ] **Step 4: Menu** — sisipkan Blog (ikon `Newspaper`) dan Galeri (ikon `Images`) setelah Testimoni.

- [ ] **Step 5: Verifikasi dan commit**

Run: `npx tsc --noEmit && npm run build`

---

### Task 4: Halaman publik

**Files:**
- Create: `src/components/blog/PostCard.tsx`, `src/components/gallery/GaleriGrid.tsx`, `src/app/[locale]/blog/{page,[slug]/page}.tsx`
- Modify: `src/app/[locale]/testimoni/page.tsx`, `src/components/layout/nav-items.ts`, `src/i18n/messages/*.ts`

- [ ] **Step 1: Kamus empat bahasa** — bagian `blog` dan `gallery`, plus `nav.blog`.

- [ ] **Step 2: Halaman blog** — `/blog` dan `/blog/[slug]`, `generateStaticParams` atas bahasa × artikel terbit, `generateMetadata` dengan `buildAlternates`, `revalidate = 300`, dan `notFound()` untuk slug asing atau artikel yang belum terbit.

- [ ] **Step 3: Galeri di halaman Testimoni** — kisi foto di bawah daftar testimoni, disembunyikan seluruhnya bila belum ada foto.

- [ ] **Step 4: Menu** — sisipkan Blog pada `NAV_ITEMS`. Menu sudah delapan; periksa ulang bilah atas dengan potret pada 1024 dan 1280 piksel dalam empat bahasa.

- [ ] **Step 5: Verifikasi dan commit**

---

### Task 5: Sitemap yang tertinggal, verifikasi, penerbitan

**Files:**
- Modify: `src/app/sitemap.ts`, `README.md`

- [ ] **Step 1: Lengkapi sitemap**

`/tours`, `/tours/[slug]`, `/tiket`, dan `/syarat-ketentuan` belum terdaftar sejak ditambahkan, dan `/blog` beserta artikelnya juga harus masuk. Tanpa itu Google harus menemukannya sendiri lewat tautan, dan halaman baru butuh waktu jauh lebih lama untuk terindeks.

- [ ] **Step 2: Tes**

Run: `for i in 1 2 3; do npx vitest run tests/unit tests/properties tests/components 2>&1 | grep -E "^ *Tests +[0-9]"; done`
Lalu: `npx vitest run tests/integration`

- [ ] **Step 3: Perbarui README** — Blog dan Galeri dikelola di admin, berbeda dari Tours yang statis; isi artikel tidak pernah dirender sebagai HTML.

- [ ] **Step 4: Terbitkan dan verifikasi produksi** — `/blog` empat bahasa 200, sitemap memuat seluruh halaman, panel admin 200 bersesi dan 307 tanpa sesi.
