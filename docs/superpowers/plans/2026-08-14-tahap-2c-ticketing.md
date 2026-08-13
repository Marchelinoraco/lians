# Tahap 2C — Ticketing: Permintaan Tiket Pesawat

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Halaman `/tiket` dalam empat bahasa yang menerima permintaan pemesanan tiket pesawat — rute, maskapai, tanggal, jumlah penumpang, dan data pelanggan — tersimpan di database dan terbaca di panel admin, tanpa menampilkan harga.

**Architecture:** Mengikuti pola permintaan tur yang sudah jadi: daftar maskapai adalah data statis di repo, permintaannya tersimpan di database karena itu pesanan. Halaman dibuat penuh saat build kecuali bagian yang membaca pengaturan.

**Tech Stack:** Next.js 16 · TypeScript strict · Drizzle ORM · Zod 4 · Vitest

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Situs **sedang tayang**.
- **Harga tiket tidak ditampilkan dan tidak disimpan.** Tarif penerbangan berubah setiap jam dan bergantung ketersediaan kelas; angka yang langsung basi lebih merugikan daripada tidak ada angka.
- **Tanpa logo maskapai.** Logo adalah merek dagang pihak lain dan tidak dapat diunduh. Nama maskapai boleh disebut — menyebut maskapai yang tiketnya bisa dipesankan adalah pernyataan faktual yang wajar bagi agen perjalanan.
- **Jangan menyebut maskapai sebagai "mitra" atau "partner"** kecuali pemilik memastikan ada perjanjian kemitraan. Yang aman dan tetap benar: "maskapai yang tiketnya dapat kami pesankan".
- Empat bahasa lengkap, kontraknya dijaga `type Messages = typeof id`.
- TypeScript `strict`, tanpa `any`. Commit tiap akhir tugas, pesan berbahasa Indonesia.

## Peta Berkas

```
src/data/maskapai.ts                     ← BARU: daftar maskapai statis
src/db/schema.ts                         ← tabel ticketRequests
src/schemas/ticket-request.ts            ← BARU
src/actions/ticket-request.ts            ← BARU
src/queries/ticket-requests.ts           ← BARU
src/actions/admin-ticket-requests.ts     ← BARU
src/components/ticket/TicketRequestForm.tsx ← BARU
src/app/[locale]/tiket/page.tsx          ← BARU
src/app/admin/permintaan-tiket/          ← BARU
src/lib/whatsapp.ts                      ← buildTicketRequestMessage
src/i18n/messages/*.ts                   ← bagian `ticket`
src/components/layout/nav-items.ts       ← menu Ticketing
```

---

### Task 1: Data maskapai, tabel, dan Server Action

**Files:**
- Create: `src/data/maskapai.ts`, `src/schemas/ticket-request.ts`, `src/actions/ticket-request.ts`
- Modify: `src/db/schema.ts`, `src/lib/whatsapp.ts`
- Test: `tests/integration/ticket-request.test.ts`

**Interfaces:**
- Consumes: `cocokkanAtauBuatPelanggan`, `checkRateLimit`, `generateBookingCode`, `getSettings`
- Produces:
  - `MASKAPAI: readonly Maskapai[]`, `MASKAPAI_KODE: string[]` dari `@/data/maskapai`
  - tabel `ticketRequests`
  - `createTicketRequest(input)` → `ActionResult<{ requestCode; whatsappUrl }>`

- [ ] **Step 1: Daftar maskapai**

Create `src/data/maskapai.ts`. Enam maskapai yang benar-benar melayani Bandara Sam Ratulangi, ditambah pilihan "belum menentukan" yang ditangani terpisah sebagai nilai kosong:

```ts
export type Maskapai = { kode: string; nama: string };

/**
 * Maskapai yang tiketnya dapat dipesankan LIANS, bukan "mitra" — menyebut
 * kemitraan yang tidak ada adalah klaim yang bisa dipersoalkan.
 *
 * Statis di repo karena jarang berubah dan tidak perlu CRUD. Menyunting daftar
 * ini lalu menerbitkan ulang sudah cukup.
 */
export const MASKAPAI: readonly Maskapai[] = [
  { kode: 'garuda', nama: 'Garuda Indonesia' },
  { kode: 'citilink', nama: 'Citilink' },
  { kode: 'lion', nama: 'Lion Air' },
  { kode: 'batik', nama: 'Batik Air' },
  { kode: 'wings', nama: 'Wings Air' },
  { kode: 'super-air-jet', nama: 'Super Air Jet' },
];

export const MASKAPAI_KODE: string[] = MASKAPAI.map((m) => m.kode);

export function namaMaskapai(kode: string | null): string | null {
  if (!kode) return null;
  return MASKAPAI.find((m) => m.kode === kode)?.nama ?? null;
}
```

- [ ] **Step 2: Tabel**

Modify `src/db/schema.ts`, tepat sebelum `testimonials`:

```ts
/**
 * Permintaan pemesanan tiket pesawat.
 *
 * Tidak ada kolom harga sama sekali, dan itu disengaja: tarif penerbangan
 * berubah setiap jam. Harga disepakati lewat WhatsApp saat penawaran dibuat.
 */
export const ticketRequests = pgTable('ticket_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestCode: text('request_code').notNull().unique(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  // Boleh kosong: pelanggan yang belum menentukan maskapai justru yang paling
  // butuh dibantu memilih.
  airline: text('airline'),
  departureDate: date('departure_date').notNull(),
  returnDate: date('return_date'),
  pax: integer('pax').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TicketRequest = typeof ticketRequests.$inferSelect;
```

- [ ] **Step 3: Skema validasi**

Create `src/schemas/ticket-request.ts` — `origin` dan `destination` teks bebas 2–100 karakter, `airline` union `''` atau salah satu `MASKAPAI_KODE`, `departureDate` wajib, `returnDate` opsional dan tidak boleh mendahului keberangkatan, `pax` 1–50, data pelanggan seperti pada `tourRequestSchema`.

- [ ] **Step 4: Pesan WhatsApp**

Modify `src/lib/whatsapp.ts` — tambahkan `buildTicketRequestMessage`, berbahasa Indonesia, **tanpa baris harga**, ditutup dengan permintaan penawaran.

- [ ] **Step 5: Server Action**

Create `src/actions/ticket-request.ts` — pola sama persis dengan `createTourRequest`: pembatas laju `tiket:${ip}` 5 per jam, validasi, cocokkan pelanggan, simpan, kembalikan tautan WhatsApp.

- [ ] **Step 6: Migrasi**

```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 7: Tes integrasi**

Create `tests/integration/ticket-request.test.ts` — reset pembatas laju di `beforeEach` seperti pada tes permintaan tur. Uji: menyimpan permintaan sah; menerima maskapai kosong; menolak kode maskapai karangan; menolak `pax` nol; menolak tanggal kembali sebelum keberangkatan; membuat catatan pelanggan; pesan WhatsApp tanpa angka rupiah. Bersihkan permintaan, pelanggan, dan kunci pembatas laju di `afterAll`.

- [ ] **Step 8: Commit**

---

### Task 2: Halaman publik dan formulir

**Files:**
- Create: `src/components/ticket/TicketRequestForm.tsx`, `src/app/[locale]/tiket/page.tsx`
- Modify: `src/i18n/messages/*.ts`, `src/components/layout/nav-items.ts`

- [ ] **Step 1: Kamus empat bahasa**

Modify keempat kamus — `nav.ticketing`, lalu bagian `ticket` berisi judul, subjudul, label kolom, teks penjelas mengapa harga tidak ditampilkan, dan pesan sukses.

Teks penjelas harga wajib ada dan jujur, misalnya dalam bahasa Indonesia: "Harga tiket berubah setiap jam dan bergantung ketersediaan kelas. Kami cek langsung ke sistem maskapai lalu mengirimkan penawarannya lewat WhatsApp."

- [ ] **Step 2: Formulir**

Create `src/components/ticket/TicketRequestForm.tsx` — Rute (asal, tujuan), Maskapai (`<select>` dengan opsi pertama "Belum menentukan"), Tanggal keberangkatan, Tanggal kembali opsional, Jumlah penumpang, lalu nama, WhatsApp, email opsional, catatan. Pola sama dengan `TourRequestForm`.

- [ ] **Step 3: Halaman**

Create `src/app/[locale]/tiket/page.tsx` dengan `generateStaticParams` atas empat bahasa, `generateMetadata` per bahasa, daftar nama maskapai sebagai teks, dan formulirnya.

- [ ] **Step 4: Menu**

Modify `src/components/layout/nav-items.ts` — sisipkan `{ href: '/tiket', key: 'ticketing' }` setelah `/tours`.

- [ ] **Step 5: Verifikasi**

Run: `npx tsc --noEmit && npm run build`
Expected: `/[locale]/tiket` muncul sebagai ● untuk keempat bahasa.

- [ ] **Step 6: Commit**

---

### Task 3: Permintaan tiket di panel admin

**Files:**
- Create: `src/queries/ticket-requests.ts`, `src/actions/admin-ticket-requests.ts`, `src/app/admin/permintaan-tiket/page.tsx`, `src/app/admin/permintaan-tiket/[id]/page.tsx`
- Modify: `src/components/admin/AdminNav.tsx`

- [ ] **Step 1: Kueri dan action** — `getTicketRequests(status?)`, `getTicketRequestById`, lalu `updateTicketRequestStatus`, `updateTicketRequestNotes`, `deleteTicketRequest`, masing-masing memanggil `requireSession()` sendiri.

- [ ] **Step 2: Halaman** — daftar berfilter status dan halaman detail, keduanya memanggil `requireAdminPage()` sebelum kueri apa pun. Pakai ulang `BookingStatusControl` dan `DeleteButton`.

- [ ] **Step 3: Menu** — `{ href: '/permintaan-tiket', label: 'Permintaan Tiket', Icon: Plane }` setelah Permintaan Tur.

- [ ] **Step 4: Verifikasi dan commit**

---

### Task 4: Verifikasi dan penerbitan

- [ ] **Step 1:** Tes tanpa database tiga kali, hasilnya identik.
- [ ] **Step 2:** Seluruh tes integrasi lulus, dan database bersih dari sisa data uji setelahnya.
- [ ] **Step 3:** Perbarui README — Ticketing masuk daftar menu, dan tambahkan keputusan: harga tiket tidak ditampilkan maupun disimpan; daftar maskapai statis di `src/data/maskapai.ts`; maskapai tidak disebut sebagai mitra.
- [ ] **Step 4:** Commit, `git push origin main`, tunggu deploy.
- [ ] **Step 5:** Verifikasi produksi — `/tiket` empat bahasa 200, `admin.lians.id/permintaan-tiket` 200 bersesi dan 307 tanpa sesi, tidak ada `Rp<angka>` pada halaman tiket, dan halaman publik lama tetap 200.
