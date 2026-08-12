# Tahap 2B — Operasi Internal: Peran, Booking Manual, Pelanggan, Pemasok

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menjadikan panel admin alat operasi harian LIANS — mencatat pesanan yang masuk lewat telepon, menyimpan data pelanggan, melacak kendaraan pinjaman beserta utangnya ke pemasok, dan memisahkan angka keuangan agar hanya terlihat super admin.

**Architecture:** Empat kemampuan yang saling mengunci, dibangun berurutan dari yang paling mendasar. Peran lebih dulu karena menentukan siapa melihat apa; lalu pelanggan karena booking manual memerlukannya; lalu booking manual; lalu pemasok yang menempel padanya; terakhir rekap yang menjumlahkan semuanya. Seluruh tabel baru menyusul pola Fase 1: Server Component membaca lewat `queries/`, Server Action menulis lewat `actions/` dengan pemeriksaan sesi di dalam action itu sendiri.

**Tech Stack:** Next.js 16 · TypeScript strict · Drizzle ORM · Neon Postgres · Zod 4 · Auth.js v5 · Vitest

**Spesifikasi:** `docs/superpowers/specs/2026-08-11-lians-fase-2-design.md` (Tahap 2B)

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Situs **sedang tayang** di `lians.id` dan menerima pesanan sungguhan.
- Panel admin berbahasa **Indonesia saja**. Tidak ada kamus, tidak ada `Localized<T>` untuk teks admin.
- Harga integer rupiah. Mata uang IDR.
- **Satu-satunya pembatasan peran:** kartu rekap uang di dasbor dan halaman rekap keuangan hanya untuk `super_admin`. Admin biasa tetap melihat pesanan satu per satu berikut harganya, tetap boleh mengelola armada, pemasok, pengaturan, akun staf, dan menghapus data.
- **Booking manual: tanggal hanya informasi.** Tidak dipakai menghitung apa pun. Admin mengetik total harga sendiri.
- **Pemasok hanya pada booking manual.** Booking dari website selalu memakai armada LIANS sendiri.
- `supplierCost` adalah **total** biaya per pesanan, bukan per hari, dan terpisah dari `totalPrice` yang dibayar pelanggan.
- Nomor telepon pelanggan disimpan **ternormalisasi** memakai `normalizePhone` dari `@/lib/whatsapp`, sehingga `0811…` dan `+62811…` mengenali orang yang sama.
- Nama dan telepon pelanggan **tetap disalin** ke dalam pesanan. Mengubah data pelanggan kelak tidak boleh mengubah isi pesanan lama.
- TypeScript `strict`, tanpa `any` di kode produksi. Path alias `@/*` → `src/*`.
- Commit tiap akhir tugas, pesan berbahasa Indonesia.
- **Jaringan ke Neon sedang tidak stabil** (terukur 1–44 detik per kueri). Bila tes integrasi gagal di tempat berbeda-beda tiap jalan, periksa latensi lebih dulu sebelum mencurigai kode; tes unit dan komponen tidak menyentuh database sama sekali.

## Peta Berkas

```
src/db/schema.ts                    ← 3 tabel baru + kolom baru pada bookings & users
src/lib/customer-match.ts           ← BARU: pencocokan pelanggan lewat telepon ternormalisasi
src/schemas/customer.ts             ← BARU
src/schemas/supplier.ts             ← BARU
src/schemas/manual-booking.ts       ← BARU
src/queries/customers.ts            ← BARU
src/queries/suppliers.ts            ← BARU
src/queries/rekap.ts                ← BARU: angka keuangan, dipanggil hanya oleh super admin
src/actions/auth-guard.ts           ← requireSuperAdmin
src/actions/admin-customers.ts      ← BARU
src/actions/admin-suppliers.ts      ← BARU
src/actions/admin-manual-booking.ts ← BARU
src/actions/booking.ts              ← menautkan pesanan website ke pelanggan
src/components/admin/               ← form pelanggan, pemasok, booking manual
src/app/admin/pelanggan/            ← BARU
src/app/admin/pemasok/              ← BARU
src/app/admin/booking/manual/       ← BARU
src/app/admin/rekap/                ← BARU, khusus super admin
```

Berkas dipisah per entitas, bukan per lapisan teknis: `admin-suppliers.ts` memuat seluruh operasi tulis pemasok, sehingga aturan pemasok terbaca di satu tempat.

---

### Task 1: Peran pengguna

**Files:**
- Modify: `src/db/schema.ts`, `src/actions/auth-guard.ts`, `src/lib/auth.ts`, `src/db/seed.ts`
- Create: `scripts/jadikan-super-admin.mjs`
- Test: `tests/unit/auth-guard.test.ts`

**Interfaces:**
- Consumes: `auth` dari `@/lib/auth`
- Produces:
  - `users.role` bertipe `'admin' | 'super_admin'`, bawaan `'admin'`
  - `requireSuperAdmin(): Promise<{ id: string; email: string; role: 'super_admin' }>` dari `@/actions/auth-guard` — melempar `SesiTidakValidError` bila bukan super admin
  - `requireSuperAdminPage(): Promise<{ id: string; email: string }>` — mengalihkan ke `/` bila bukan super admin
  - `sesiSekarang(): Promise<{ id: string; email: string; role: string } | null>`

- [ ] **Step 1: Tambahkan kolom peran**

Modify `src/db/schema.ts` — tambahkan enum di dekat enum lain:

```ts
export const userRoleEnum = pgEnum('user_role', ['admin', 'super_admin']);
```

Pada tabel `users`, tambahkan setelah `name`:

```ts
  role: userRoleEnum('role').notNull().default('admin'),
```

- [ ] **Step 2: Sertakan peran di sesi**

Modify `src/lib/auth.ts` — pada `authorize`, ganti baris `return` terakhir menjadi:

```ts
        // Disimpan ke variabel dulu, bukan dikembalikan sebagai literal:
        // `role` bukan bagian dari tipe User bawaan Auth.js, dan pemeriksaan
        // properti berlebih hanya berlaku untuk objek literal yang langsung
        // dikembalikan. Nilainya dibaca lagi di callback jwt di bawah.
        const identitas = { id: user.id, email: user.email, name: user.name, role: user.role };
        return identitas;
```

Ganti kedua callback:

```ts
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = (user as { role?: string }).role ?? 'admin';
      }
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      // Peran dititipkan lewat token, tidak dibaca ulang dari database:
      // callback ini berjalan pada setiap permintaan ke panel admin.
      (session.user as { role?: string }).role =
        typeof token.role === 'string' ? token.role : 'admin';
      return session;
    },
  },
```

Peran sengaja dibaca lewat satu titik cast, bukan lewat `declare module 'next-auth'`. Tipe `Session` dan `User` di `next-auth@5.0.0-beta` hanya diekspor ulang dari `@auth/core/types`, sehingga augmentasi modul tidak dijamin menyatu dan bisa patah pada rilis beta berikutnya. Pembacaannya dipusatkan di `sesiSekarang()` sehingga cast ini tidak menyebar ke seluruh kode.

- [ ] **Step 3: Tulis tes penjaga peran yang gagal**

Tambahkan ke `tests/unit/auth-guard.test.ts` — perbarui impor lebih dulu:

```ts
const { requireSession, requireAdminPage, requireSuperAdmin, requireSuperAdminPage, sesiSekarang, SesiTidakValidError } =
  await import('@/actions/auth-guard');
```

Lalu tambahkan:

```ts
describe('requireSuperAdmin', () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
  });

  it('meneruskan super admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'bos@lians.id', role: 'super_admin' } });
    await expect(requireSuperAdmin()).resolves.toMatchObject({ id: 'u1', role: 'super_admin' });
  });

  it('menolak admin biasa', async () => {
    authMock.mockResolvedValue({ user: { id: 'u2', email: 'staf@lians.id', role: 'admin' } });
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('menolak sesi tanpa peran sama sekali', async () => {
    authMock.mockResolvedValue({ user: { id: 'u3', email: 'staf@lians.id' } });
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(SesiTidakValidError);
  });
});

describe('requireSuperAdminPage', () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
  });

  it('meneruskan super admin tanpa mengalihkan', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'bos@lians.id', role: 'super_admin' } });
    await expect(requireSuperAdminPage()).resolves.toEqual({ id: 'u1', email: 'bos@lians.id' });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  it('mengalihkan admin biasa ke dasbor, bukan ke login', async () => {
    // Dialihkan ke dasbor karena sesinya sah — ia hanya tidak berhak
    // melihat halaman ini. Melemparnya ke login akan membingungkan.
    authMock.mockResolvedValue({ user: { id: 'u2', email: 'staf@lians.id', role: 'admin' } });
    await expect(requireSuperAdminPage()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('mengalihkan ke login bila tidak ada sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSuperAdminPage()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});

describe('sesiSekarang', () => {
  beforeEach(() => authMock.mockReset());

  it('mengembalikan identitas beserta perannya', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'bos@lians.id', role: 'super_admin' } });
    await expect(sesiSekarang()).resolves.toEqual({
      id: 'u1',
      email: 'bos@lians.id',
      role: 'super_admin',
    });
  });

  it('menganggap sesi tanpa peran sebagai admin biasa', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'staf@lians.id' } });
    await expect(sesiSekarang()).resolves.toMatchObject({ role: 'admin' });
  });

  it('mengembalikan null tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(sesiSekarang()).resolves.toBeNull();
  });
});
```

- [ ] **Step 4: Jalankan, pastikan gagal**

Run: `npm test -- tests/unit/auth-guard.test.ts`
Expected: FAIL — `requireSuperAdmin` belum ada

- [ ] **Step 5: Implementasi penjaga peran**

Tambahkan ke `src/actions/auth-guard.ts`:

```ts
export type Peran = 'admin' | 'super_admin';

export async function sesiSekarang(): Promise<{
  id: string;
  email: string;
  role: Peran;
} | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  // Satu-satunya tempat peran dibaca dari sesi. Sesi lama yang terbit sebelum
  // kolom peran ada tidak membawa role sama sekali; diperlakukan sebagai admin
  // biasa — jatuh ke hak yang paling sedikit, bukan yang paling banyak.
  const mentah = (session.user as { role?: string }).role;
  const role: Peran = mentah === 'super_admin' ? 'super_admin' : 'admin';
  return { id, email: session.user.email ?? '', role };
}

/**
 * Dipanggil di awal setiap Server Action yang mengembalikan angka keuangan.
 * Layout tidak melindungi permintaan yang menembak action secara langsung.
 */
export async function requireSuperAdmin(): Promise<{
  id: string;
  email: string;
  role: 'super_admin';
}> {
  const sesi = await sesiSekarang();
  if (!sesi || sesi.role !== 'super_admin') throw new SesiTidakValidError();
  return { id: sesi.id, email: sesi.email, role: 'super_admin' };
}

/**
 * Penjaga halaman khusus super admin.
 *
 * Admin biasa dialihkan ke dasbor, bukan ke login: sesinya sah, ia hanya tidak
 * berhak melihat halaman ini. Melemparnya ke halaman login akan terasa seperti
 * sesinya kedaluwarsa dan membuatnya mencoba login berulang-ulang.
 */
export async function requireSuperAdminPage(): Promise<{ id: string; email: string }> {
  const sesi = await sesiSekarang();
  if (!sesi) redirect('/login');
  if (sesi.role !== 'super_admin') redirect('/');
  return { id: sesi.id, email: sesi.email };
}
```

- [ ] **Step 6: Jalankan, pastikan lulus**

Run: `npm test -- tests/unit/auth-guard.test.ts`
Expected: PASS

- [ ] **Step 7: Migrasi dan naikkan akun pertama**

```bash
npm run db:generate
npm run db:migrate
```

Create `scripts/jadikan-super-admin.mjs`:

```js
import { neon } from '@neondatabase/serverless';

/**
 * Menjadikan satu akun sebagai super admin.
 *
 * Kolom role berbawaan 'admin', jadi tanpa skrip ini tidak ada seorang pun yang
 * dapat membuka halaman rekap — termasuk pemilik.
 *
 * Jalankan: node --env-file=.env.local scripts/jadikan-super-admin.mjs admin@lians.id
 */
const email = process.argv[2];
if (!email) {
  console.error('Sertakan email. Contoh: node --env-file=.env.local scripts/jadikan-super-admin.mjs admin@lians.id');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function coba(fn, label) {
  for (let i = 1; i <= 5; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === 5) throw new Error(`${label} gagal setelah 5 percobaan: ${e.message}`);
      console.log(`  ${label}: percobaan ${i} gagal, mengulang…`);
      await new Promise((r) => setTimeout(r, i * 3000));
    }
  }
}

const hasil = await coba(
  () => sql`update users set role = 'super_admin' where email = ${email} returning email, role`,
  'menaikkan peran',
);

console.log(hasil.length === 0 ? `Akun ${email} tidak ditemukan.` : `${hasil[0].email} kini ${hasil[0].role}.`);
```

Run: `node --env-file=.env.local scripts/jadikan-super-admin.mjs admin@lians.id`
Expected: `admin@lians.id kini super_admin.`

- [ ] **Step 8: Jadikan akun seed pertama super admin**

Modify `src/db/seed.ts` — pada `db.insert(users).values({...})`, tambahkan:

```ts
    role: 'super_admin',
```

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: peran admin dan super admin"
```

---

### Task 2: Master data pelanggan

**Files:**
- Create: `src/lib/customer-match.ts`, `src/schemas/customer.ts`, `src/queries/customers.ts`, `src/actions/admin-customers.ts`
- Modify: `src/db/schema.ts`, `src/actions/booking.ts`
- Test: `tests/unit/customer-match.test.ts`, `tests/integration/customers.test.ts`

**Interfaces:**
- Consumes: `normalizePhone` dari `@/lib/whatsapp`, `requireSession` dari `@/actions/auth-guard`
- Produces:
  - tabel `customers`
  - `customerInputSchema`, `type CustomerInput` dari `@/schemas/customer`
  - `cocokkanAtauBuatPelanggan(data: { name: string; phone: string; email?: string | null }): Promise<string>` dari `@/lib/customer-match` — mengembalikan `customers.id`
  - `getCustomers(q?: string)`, `getCustomerById(id)`, `getCustomerBookings(id)` dari `@/queries/customers`
  - `createCustomer`, `updateCustomer`, `deleteCustomer` dari `@/actions/admin-customers`

- [ ] **Step 1: Tambahkan tabel pelanggan**

Modify `src/db/schema.ts` — sebelum tabel `bookings`:

```ts
export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Disimpan ternormalisasi (62…) supaya 0811… dan +62811… mengenali orang
  // yang sama. Tanpa itu satu pelanggan bisa punya beberapa catatan.
  phone: text('phone').notNull().unique(),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Pada tabel `bookings`, tambahkan setelah `email`:

```ts
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
```

Tambahkan tipe di akhir berkas:

```ts
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
```

- [ ] **Step 2: Tulis tes pencocokan yang gagal**

Create `tests/unit/customer-match.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: selectMock }) }) }),
    insert: () => ({ values: () => ({ returning: insertMock }) }),
    update: () => ({ set: () => ({ where: updateMock }) }),
  },
}));

const { cocokkanAtauBuatPelanggan } = await import('@/lib/customer-match');

describe('cocokkanAtauBuatPelanggan', () => {
  it('memakai catatan yang ada bila nomornya cocok setelah dinormalkan', async () => {
    selectMock.mockResolvedValueOnce([{ id: 'ada', name: 'Budi', phone: '6281234567890' }]);
    updateMock.mockResolvedValueOnce(undefined);

    const id = await cocokkanAtauBuatPelanggan({ name: 'Budi', phone: '081234567890' });
    expect(id).toBe('ada');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('membuat catatan baru bila nomornya belum terdaftar', async () => {
    selectMock.mockResolvedValueOnce([]);
    insertMock.mockResolvedValueOnce([{ id: 'baru' }]);

    const id = await cocokkanAtauBuatPelanggan({ name: 'Sari', phone: '+6281199887766' });
    expect(id).toBe('baru');
  });
});
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `npm test -- tests/unit/customer-match.test.ts`
Expected: FAIL — modul belum ada

- [ ] **Step 4: Implementasi pencocokan**

Create `src/lib/customer-match.ts`:

```ts
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { normalizePhone } from '@/lib/whatsapp';

/**
 * Mencari pelanggan lewat nomor telepon ternormalisasi; membuat catatan baru
 * bila belum ada. Mengembalikan id pelanggan.
 *
 * Nama pada catatan pelanggan diperbarui ke yang terbaru, tetapi nama yang
 * tersimpan di dalam pesanan TIDAK ikut berubah — pesanan menyimpan salinannya
 * sendiri supaya riwayat tetap sesuai keadaan saat itu.
 */
export async function cocokkanAtauBuatPelanggan(data: {
  name: string;
  phone: string;
  email?: string | null;
}): Promise<string> {
  const phone = normalizePhone(data.phone);

  const [ada] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);

  if (ada) {
    await db
      .update(customers)
      .set({
        name: data.name,
        email: data.email || ada.email,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, ada.id));
    return ada.id;
  }

  const [baru] = await db
    .insert(customers)
    .values({ name: data.name, phone, email: data.email || null })
    .returning({ id: customers.id });

  return baru.id;
}
```

- [ ] **Step 5: Jalankan, pastikan lulus**

Run: `npm test -- tests/unit/customer-match.test.ts`
Expected: PASS, 2 tes

- [ ] **Step 6: Skema dan kueri pelanggan**

Create `src/schemas/customer.ts`:

```ts
import { z } from 'zod';

export const customerInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: z
    .string()
    .trim()
    .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid. Contoh: 081234567890'),
  email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),
  notes: z.string().max(2000).optional(),
});

export type CustomerInput = z.infer<typeof customerInputSchema>;
```

Create `src/queries/customers.ts`:

```ts
import { desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '@/db';
import { customers, bookings } from '@/db/schema';

export async function getCustomers(q?: string) {
  const dasar = db.select().from(customers);
  if (!q?.trim()) return dasar.orderBy(desc(customers.updatedAt));

  const pola = `%${q.trim()}%`;
  return db
    .select()
    .from(customers)
    .where(or(ilike(customers.name, pola), ilike(customers.phone, pola)))
    .orderBy(desc(customers.updatedAt));
}

export async function getCustomerById(id: string) {
  const [row] = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return row ?? null;
}

export async function getCustomerBookings(id: string) {
  return db
    .select()
    .from(bookings)
    .where(eq(bookings.customerId, id))
    .orderBy(desc(bookings.createdAt));
}
```

- [ ] **Step 7: Server Action pelanggan**

Create `src/actions/admin-customers.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { customerInputSchema } from '@/schemas/customer';
import { normalizePhone } from '@/lib/whatsapp';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const [ada] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  if (ada) return fail(`Nomor ini sudah terdaftar atas nama ${ada.name}.`);

  const [row] = await db
    .insert(customers)
    .values({
      name: parsed.data.name,
      phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    })
    .returning({ id: customers.id });

  revalidatePath('/pelanggan');
  return ok({ id: row.id });
}

export async function updateCustomer(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const [bentrok] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  if (bentrok && bentrok.id !== id) {
    return fail(`Nomor ini sudah terdaftar atas nama ${bentrok.name}.`);
  }

  const [row] = await db
    .update(customers)
    .set({
      name: parsed.data.name,
      phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });

  if (!row) return fail('Pelanggan tidak ditemukan.');

  revalidatePath('/pelanggan');
  revalidatePath(`/pelanggan/${id}`);
  return ok({ id: row.id });
}

export async function deleteCustomer(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  // Pesanan menyimpan nama dan telepon sebagai salinan sendiri, jadi menghapus
  // pelanggan hanya melepas tautannya — riwayat pesanan tetap terbaca utuh.
  const [row] = await db.delete(customers).where(eq(customers.id, id)).returning({
    id: customers.id,
  });
  if (!row) return fail('Pelanggan tidak ditemukan.');

  revalidatePath('/pelanggan');
  return ok({ id: row.id });
}
```

- [ ] **Step 8: Tautkan pesanan website ke pelanggan**

Modify `src/actions/booking.ts` — tambahkan impor:

```ts
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
```

Sebelum `db.insert(bookings)`, tambahkan:

```ts
  // Daftar pelanggan dibangun dari seluruh jalur masuk, bukan hanya input manual.
  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });
```

Pada objek nilai insert, tambahkan `customerId,` setelah `email`.

- [ ] **Step 9: Migrasi**

```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 10: Tes integrasi pelanggan**

Create `tests/integration/customers.test.ts`:

```ts
import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { customers } = await import('@/db/schema');
const { createCustomer, updateCustomer, deleteCustomer } = await import(
  '@/actions/admin-customers'
);
const { cocokkanAtauBuatPelanggan } = await import('@/lib/customer-match');
const { getCustomers } = await import('@/queries/customers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

jalankan('master data pelanggan', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    expect(await createCustomer({ name: 'Tak Boleh', phone: nomorUji() })).toMatchObject({
      ok: false,
    });
  });

  it('mengenali nomor yang sama walau ditulis berbeda', async () => {
    const lokal = nomorUji();
    const internasional = `+62${lokal.slice(1)}`;

    const pertama = await cocokkanAtauBuatPelanggan({ name: 'Budi', phone: lokal });
    dibuat.push(pertama);

    const kedua = await cocokkanAtauBuatPelanggan({ name: 'Budi Santoso', phone: internasional });
    expect(kedua).toBe(pertama);

    const [row] = await db.select().from(customers).where(eq(customers.id, pertama));
    expect(row.phone.startsWith('62')).toBe(true);
    expect(row.name).toBe('Budi Santoso');
  });

  it('menolak nomor yang sudah terdaftar', async () => {
    bersesi();
    const nomor = nomorUji();
    const a = await createCustomer({ name: 'Sari', phone: nomor });
    expect(a.ok).toBe(true);
    if (a.ok) dibuat.push(a.data.id);

    const b = await createCustomer({ name: 'Sari Lain', phone: nomor });
    expect(b.ok).toBe(false);
    if (b.ok) return;
    expect(b.message).toMatch(/sudah terdaftar/i);
  });

  it('menolak nomor telepon yang bukan format Indonesia', async () => {
    bersesi();
    expect(await createCustomer({ name: 'Uji', phone: '12345' })).toMatchObject({ ok: false });
  });

  it('mencari pelanggan berdasarkan nama', async () => {
    bersesi();
    const nama = `Cari Saya ${Date.now()}`;
    const hasil = await createCustomer({ name: nama, phone: nomorUji() });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    dibuat.push(hasil.data.id);

    const ketemu = await getCustomers('Cari Saya');
    expect(ketemu.some((c) => c.id === hasil.data.id)).toBe(true);
  });

  it('mengubah dan menghapus pelanggan', async () => {
    bersesi();
    const hasil = await createCustomer({ name: 'Akan Diubah', phone: nomorUji() });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    expect(
      await updateCustomer(hasil.data.id, { name: 'Sudah Diubah', phone: nomorUji() }),
    ).toMatchObject({ ok: true });

    const [row] = await db.select().from(customers).where(eq(customers.id, hasil.data.id));
    expect(row.name).toBe('Sudah Diubah');

    expect(await deleteCustomer(hasil.data.id)).toMatchObject({ ok: true });
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(customers).where(eq(customers.id, id));
});
```

- [ ] **Step 11: Jalankan tes**

Run: `npm test -- tests/unit/customer-match.test.ts tests/integration/customers.test.ts`
Expected: PASS

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: master data pelanggan dengan pencocokan nomor ternormalisasi"
```

---

### Task 3: Halaman pelanggan

**Files:**
- Create: `src/components/admin/CustomerForm.tsx`, `src/app/admin/pelanggan/page.tsx`, `src/app/admin/pelanggan/baru/page.tsx`, `src/app/admin/pelanggan/[id]/page.tsx`
- Modify: `src/components/admin/AdminNav.tsx`

**Interfaces:**
- Consumes: `getCustomers`, `getCustomerById`, `getCustomerBookings` dari `@/queries/customers`; `createCustomer`, `updateCustomer`, `deleteCustomer` dari `@/actions/admin-customers`; `requireAdminPage` dari `@/actions/auth-guard`
- Produces: `<CustomerForm customer={Customer | null} onSubmit={…} />`

- [ ] **Step 1: Buat form pelanggan**

Create `src/components/admin/CustomerForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Customer } from '@/db/schema';
import type { ActionResult } from '@/actions/result';

type Values = { name: string; phone: string; email: string; notes: string };

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function CustomerForm({
  customer,
  onSubmit,
}: {
  customer: Customer | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      notes: customer?.notes ?? '',
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit(v);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([f, p]) =>
        toast.error(`${f}: ${p.join(', ')}`),
      );
      return;
    }
    toast.success('Pelanggan tersimpan.');
    window.location.href = '/pelanggan';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
          <input {...register('phone', { required: true })} placeholder="081234567890" className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Disimpan dalam format 62… agar satu orang tidak tercatat dua kali.
          </span>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Email (opsional)</span>
          <input type="email" {...register('email')} className={kelas} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Catatan internal</span>
        <textarea rows={3} {...register('notes')} className={kelas} />
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan pelanggan'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Halaman daftar pelanggan**

Create `src/app/admin/pelanggan/page.tsx`:

```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getCustomers } from '@/queries/customers';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PelangganPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage();
  const { q } = await searchParams;
  const daftar = await getCustomers(q);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Pelanggan</h1>
        <Link
          href="/pelanggan/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah pelanggan
        </Link>
      </div>

      <form method="get" className="flex gap-2">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Cari nama atau nomor…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-lians-400"
        >
          Cari
        </button>
      </form>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Email</th>
              <th className="p-4">Terakhir diperbarui</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((c) => (
              <tr key={c.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/pelanggan/${c.id}`} className="font-semibold text-lians-700">
                    {c.name}
                  </Link>
                </td>
                <td className="p-4">{c.phone}</td>
                <td className="p-4">{c.email ?? '—'}</td>
                <td className="p-4">{formatTanggal(new Date(c.updatedAt), 'id')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">
            {q ? 'Tidak ada pelanggan yang cocok.' : 'Belum ada pelanggan.'}
          </p>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Halaman tambah pelanggan**

Create `src/app/admin/pelanggan/baru/page.tsx`:

```tsx
import { CustomerForm } from '@/components/admin/CustomerForm';
import { createCustomer } from '@/actions/admin-customers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PelangganBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Pelanggan</h1>
      <CustomerForm customer={null} onSubmit={createCustomer} />
    </div>
  );
}
```

- [ ] **Step 4: Halaman ubah pelanggan berikut riwayat pesanannya**

Create `src/app/admin/pelanggan/[id]/page.tsx`:

```tsx
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerById, getCustomerBookings } from '@/queries/customers';
import { CustomerForm } from '@/components/admin/CustomerForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateCustomer, deleteCustomer } from '@/actions/admin-customers';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PelangganEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [pelanggan, riwayat] = await Promise.all([getCustomerById(id), getCustomerBookings(id)]);
  if (!pelanggan) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateCustomer(id, input);
  }

  async function hapus() {
    'use server';
    return deleteCustomer(id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{pelanggan.name}</h1>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/pelanggan"
          konfirmasi={`Hapus ${pelanggan.name}? Riwayat pesanannya tetap tersimpan.`}
        />
      </div>

      <CustomerForm customer={pelanggan} onSubmit={simpan} />

      <section className="max-w-3xl space-y-3">
        <h2 className="font-bold">Riwayat pesanan ({riwayat.length})</h2>
        {riwayat.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted">
            Belum ada pesanan atas nama pelanggan ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {riwayat.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/booking/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-lians-300"
                >
                  <span>
                    <span className="font-semibold">
                      {b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—'}
                    </span>
                    <span className="block text-xs text-muted">
                      {b.bookingCode} · {formatTanggal(new Date(b.startDate), 'id')}
                    </span>
                  </span>
                  <span className="font-bold text-lians-600">
                    {b.totalPrice === null ? 'Menunggu penawaran' : formatRupiah(b.totalPrice)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Tambahkan ke navigasi admin**

Modify `src/components/admin/AdminNav.tsx` — tambahkan impor ikon `Users` dan sisipkan pada `ITEM` setelah Booking:

```tsx
  { href: '/pelanggan', label: 'Pelanggan', Icon: Users },
```

- [ ] **Step 6: Verifikasi**

Run: `npx tsc --noEmit && npm run build`
Expected: build sukses, rute `/admin/pelanggan`, `/admin/pelanggan/baru`, `/admin/pelanggan/[id]` muncul

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: halaman pelanggan dengan pencarian dan riwayat pesanan"
```

---

### Task 4: Pemasok

**Files:**
- Create: `src/schemas/supplier.ts`, `src/queries/suppliers.ts`, `src/actions/admin-suppliers.ts`, `src/components/admin/SupplierForm.tsx`, `src/app/admin/pemasok/page.tsx`, `src/app/admin/pemasok/baru/page.tsx`, `src/app/admin/pemasok/[id]/page.tsx`
- Modify: `src/db/schema.ts`, `src/components/admin/AdminNav.tsx`
- Test: `tests/integration/suppliers.test.ts`

**Interfaces:**
- Consumes: `requireSession` dari `@/actions/auth-guard`
- Produces:
  - tabel `suppliers` dan `supplierVehicles`
  - `supplierInputSchema`, `supplierVehicleInputSchema` dari `@/schemas/supplier`
  - `getSuppliers()`, `getSupplierById(id)`, `getSupplierVehicles(supplierId)`, `getAllSupplierVehicles()`, `getUtangPemasok()` dari `@/queries/suppliers`
  - `createSupplier`, `updateSupplier`, `deleteSupplier`, `addSupplierVehicle`, `deleteSupplierVehicle` dari `@/actions/admin-suppliers`

- [ ] **Step 1: Tabel pemasok**

Modify `src/db/schema.ts` — sebelum tabel `bookings`:

```ts
export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supplierVehicles = pgTable('supplier_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});
```

Pada tabel `bookings`, tambahkan setelah `routeId`:

```ts
  supplierVehicleId: uuid('supplier_vehicle_id').references(() => supplierVehicles.id, {
    onDelete: 'set null',
  }),
  supplierNameSnapshot: text('supplier_name_snapshot'),
  supplierCost: integer('supplier_cost'),
  supplierPaid: boolean('supplier_paid').notNull().default(false),
```

Tambahkan tipe:

```ts
export type Supplier = typeof suppliers.$inferSelect;
export type SupplierVehicle = typeof supplierVehicles.$inferSelect;
```

- [ ] **Step 2: Skema validasi pemasok**

Create `src/schemas/supplier.ts`:

```ts
import { z } from 'zod';

export const supplierInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama pemasok wajib diisi').max(100),
  phone: z
    .union([
      z.literal(''),
      z.string().trim().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid'),
    ])
    .optional(),
  notes: z.string().max(2000).optional(),
  isActive: z.boolean().default(true),
});

export const supplierVehicleInputSchema = z.object({
  supplierId: z.string().uuid('Pemasok wajib dipilih'),
  name: z.string().trim().min(2, 'Nama kendaraan wajib diisi').max(100),
  notes: z.string().max(500).optional(),
});

export type SupplierInput = z.infer<typeof supplierInputSchema>;
export type SupplierVehicleInput = z.infer<typeof supplierVehicleInputSchema>;
```

- [ ] **Step 3: Kueri pemasok berikut utangnya**

Create `src/queries/suppliers.ts`:

```ts
import { and, asc, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { suppliers, supplierVehicles, bookings } from '@/db/schema';

export async function getSuppliers() {
  return db.select().from(suppliers).orderBy(asc(suppliers.name));
}

export async function getSupplierById(id: string) {
  const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
  return row ?? null;
}

export async function getSupplierVehicles(supplierId: string) {
  return db
    .select()
    .from(supplierVehicles)
    .where(eq(supplierVehicles.supplierId, supplierId))
    .orderBy(asc(supplierVehicles.name));
}

/** Seluruh kendaraan pemasok beserta nama pemasoknya, untuk pilihan di form. */
export async function getAllSupplierVehicles() {
  return db
    .select({
      id: supplierVehicles.id,
      name: supplierVehicles.name,
      supplierId: supplierVehicles.supplierId,
      supplierName: suppliers.name,
    })
    .from(supplierVehicles)
    .innerJoin(suppliers, eq(supplierVehicles.supplierId, suppliers.id))
    .where(eq(suppliers.isActive, true))
    .orderBy(asc(suppliers.name), asc(supplierVehicles.name));
}

/**
 * Pesanan yang memakai kendaraan pemasok dan belum dibayar, dikelompokkan per
 * pemasok beserta total rupiahnya.
 *
 * Pesanan yang dibatalkan tidak dihitung: LIANS tidak berutang atas pesanan
 * yang tidak jadi berjalan.
 */
export async function getUtangPemasok() {
  const baris = await db
    .select({
      supplierId: supplierVehicles.supplierId,
      supplierName: suppliers.name,
      bookingId: bookings.id,
      bookingCode: bookings.bookingCode,
      vehicleName: supplierVehicles.name,
      startDate: bookings.startDate,
      cost: bookings.supplierCost,
    })
    .from(bookings)
    .innerJoin(supplierVehicles, eq(bookings.supplierVehicleId, supplierVehicles.id))
    .innerJoin(suppliers, eq(supplierVehicles.supplierId, suppliers.id))
    .where(and(eq(bookings.supplierPaid, false), ne(bookings.status, 'cancelled')))
    .orderBy(asc(suppliers.name), asc(bookings.startDate));

  const perPemasok = new Map<
    string,
    { supplierId: string; supplierName: string; total: number; pesanan: typeof baris }
  >();

  for (const b of baris) {
    const masuk = perPemasok.get(b.supplierId) ?? {
      supplierId: b.supplierId,
      supplierName: b.supplierName,
      total: 0,
      pesanan: [] as typeof baris,
    };
    masuk.total += b.cost ?? 0;
    masuk.pesanan.push(b);
    perPemasok.set(b.supplierId, masuk);
  }

  return [...perPemasok.values()];
}
```

- [ ] **Step 4: Server Action pemasok**

Create `src/actions/admin-suppliers.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { suppliers, supplierVehicles } from '@/db/schema';
import { supplierInputSchema, supplierVehicleInputSchema } from '@/schemas/supplier';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createSupplier(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = supplierInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .insert(suppliers)
    .values({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      isActive: parsed.data.isActive,
    })
    .returning({ id: suppliers.id });

  revalidatePath('/pemasok');
  return ok({ id: row.id });
}

export async function updateSupplier(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = supplierInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .update(suppliers)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      notes: parsed.data.notes || null,
      isActive: parsed.data.isActive,
      updatedAt: new Date(),
    })
    .where(eq(suppliers.id, id))
    .returning({ id: suppliers.id });

  if (!row) return fail('Pemasok tidak ditemukan.');

  revalidatePath('/pemasok');
  revalidatePath(`/pemasok/${id}`);
  return ok({ id: row.id });
}

export async function deleteSupplier(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  // Pesanan menyimpan nama pemasok sebagai salinan sendiri, jadi menghapus
  // pemasok tidak menghilangkan jejak siapa yang meminjamkan kendaraannya.
  const [row] = await db.delete(suppliers).where(eq(suppliers.id, id)).returning({
    id: suppliers.id,
  });
  if (!row) return fail('Pemasok tidak ditemukan.');

  revalidatePath('/pemasok');
  return ok({ id: row.id });
}

export async function addSupplierVehicle(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = supplierVehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const [row] = await db
    .insert(supplierVehicles)
    .values({
      supplierId: parsed.data.supplierId,
      name: parsed.data.name,
      notes: parsed.data.notes || null,
    })
    .returning({ id: supplierVehicles.id });

  revalidatePath(`/pemasok/${parsed.data.supplierId}`);
  return ok({ id: row.id });
}

export async function deleteSupplierVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const [row] = await db.delete(supplierVehicles).where(eq(supplierVehicles.id, id)).returning({
    id: supplierVehicles.id,
    supplierId: supplierVehicles.supplierId,
  });
  if (!row) return fail('Kendaraan pemasok tidak ditemukan.');

  revalidatePath(`/pemasok/${row.supplierId}`);
  return ok({ id: row.id });
}
```

- [ ] **Step 5: Migrasi**

```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 6: Tes integrasi pemasok**

Create `tests/integration/suppliers.test.ts`:

```ts
import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { suppliers, supplierVehicles, bookings } = await import('@/db/schema');
const { createSupplier, updateSupplier, deleteSupplier, addSupplierVehicle } = await import(
  '@/actions/admin-suppliers'
);
const { getUtangPemasok, getAllSupplierVehicles } = await import('@/queries/suppliers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const pemasokDibuat: string[] = [];
const pesananDibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

jalankan('pemasok', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    expect(await createSupplier({ name: 'Tak Boleh' })).toMatchObject({ ok: false });
  });

  it('membuat pemasok beserta kendaraannya', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Uji ${Date.now()}`, phone: '081234567890' });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Avanza Pinjaman' });
    expect(k.ok).toBe(true);

    const semua = await getAllSupplierVehicles();
    expect(semua.some((v) => v.id === (k.ok ? k.data.id : ''))).toBe(true);
  });

  it('menyembunyikan kendaraan dari pemasok yang dinonaktifkan', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Nonaktif ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Xenia Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    await updateSupplier(p.data.id, { name: 'Pemasok Nonaktif', isActive: false });

    const semua = await getAllSupplierVehicles();
    expect(semua.some((v) => v.id === k.data.id)).toBe(false);
  });

  it('menghitung utang per pemasok dari pesanan yang belum lunas', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Utang ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Innova Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    for (const [kode, biaya, lunas] of [
      ['A', 500000, false],
      ['B', 300000, false],
      ['C', 900000, true],
    ] as const) {
      const [row] = await db
        .insert(bookings)
        .values({
          bookingCode: `LNS-UTANG-${kode}${Date.now().toString(36).slice(-4).toUpperCase()}`,
          customerName: 'Uji Utang',
          phone: '081234567890',
          serviceType: 'with-driver',
          startDate: '2099-09-01',
          supplierVehicleId: k.data.id,
          supplierNameSnapshot: 'Pemasok Utang',
          supplierCost: biaya,
          supplierPaid: lunas,
          totalPrice: biaya + 200000,
          status: 'confirmed',
        })
        .returning({ id: bookings.id });
      pesananDibuat.push(row.id);
    }

    const utang = await getUtangPemasok();
    const milikKita = utang.find((u) => u.supplierId === p.data.id);

    expect(milikKita).toBeTruthy();
    // Hanya dua pesanan belum lunas yang dihitung; yang sudah lunas diabaikan.
    expect(milikKita?.total).toBe(800000);
    expect(milikKita?.pesanan).toHaveLength(2);
  });

  it('tidak menghitung pesanan yang dibatalkan sebagai utang', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Batal ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;
    pemasokDibuat.push(p.data.id);

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Rush Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-BATAL-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        customerName: 'Uji Batal',
        phone: '081234567890',
        serviceType: 'with-driver',
        startDate: '2099-09-01',
        supplierVehicleId: k.data.id,
        supplierCost: 400000,
        supplierPaid: false,
        totalPrice: 600000,
        status: 'cancelled',
      })
      .returning({ id: bookings.id });
    pesananDibuat.push(row.id);

    const utang = await getUtangPemasok();
    expect(utang.find((u) => u.supplierId === p.data.id)).toBeUndefined();
  });

  it('menghapus pemasok ikut menghapus daftar kendaraannya', async () => {
    bersesi();
    const p = await createSupplier({ name: `Pemasok Dihapus ${Date.now()}` });
    expect(p.ok).toBe(true);
    if (!p.ok) return;

    const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Brio Pinjaman' });
    expect(k.ok).toBe(true);
    if (!k.ok) return;

    expect(await deleteSupplier(p.data.id)).toMatchObject({ ok: true });

    const [sisa] = await db
      .select()
      .from(supplierVehicles)
      .where(eq(supplierVehicles.id, k.data.id));
    expect(sisa).toBeUndefined();
  });
});

afterAll(async () => {
  for (const id of pesananDibuat) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of pemasokDibuat) await db.delete(suppliers).where(eq(suppliers.id, id));
});
```

- [ ] **Step 7: Jalankan tes**

Run: `npm test -- tests/integration/suppliers.test.ts`
Expected: PASS, 6 tes

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: tabel dan Server Action pemasok berikut perhitungan utang"
```

---

### Task 5: Halaman pemasok

**Files:**
- Create: `src/components/admin/SupplierForm.tsx`, `src/components/admin/SupplierVehicleList.tsx`, `src/app/admin/pemasok/page.tsx`, `src/app/admin/pemasok/baru/page.tsx`, `src/app/admin/pemasok/[id]/page.tsx`
- Modify: `src/components/admin/AdminNav.tsx`

**Interfaces:**
- Consumes: `getSuppliers`, `getSupplierById`, `getSupplierVehicles`, `getUtangPemasok` dari `@/queries/suppliers`; `createSupplier`, `updateSupplier`, `deleteSupplier`, `addSupplierVehicle`, `deleteSupplierVehicle` dari `@/actions/admin-suppliers`
- Produces: `<SupplierForm supplier={Supplier | null} onSubmit={…} />`, `<SupplierVehicleList supplierId={string} kendaraan={SupplierVehicle[]} onAdd={…} onDelete={…} />`

- [ ] **Step 1: Form pemasok**

Create `src/components/admin/SupplierForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Supplier } from '@/db/schema';
import type { ActionResult } from '@/actions/result';

type Values = { name: string; phone: string; notes: string; isActive: boolean };

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function SupplierForm({
  supplier,
  onSubmit,
}: {
  supplier: Supplier | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      name: supplier?.name ?? '',
      phone: supplier?.phone ?? '',
      notes: supplier?.notes ?? '',
      isActive: supplier?.isActive ?? true,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit(v);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    toast.success('Pemasok tersimpan.');
    window.location.href = '/pemasok';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama pemasok</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp (opsional)</span>
          <input {...register('phone')} placeholder="081234567890" className={kelas} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Catatan</span>
        <textarea rows={3} {...register('notes')} className={kelas} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isActive')} />
        Aktif — kendaraannya bisa dipilih saat mencatat booking manual
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan pemasok'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Daftar kendaraan pemasok**

Create `src/components/admin/SupplierVehicleList.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { SupplierVehicle } from '@/db/schema';
import type { ActionResult } from '@/actions/result';

type Values = { name: string; notes: string };

export function SupplierVehicleList({
  supplierId,
  kendaraan,
  onAdd,
  onDelete,
}: {
  supplierId: string;
  kendaraan: SupplierVehicle[];
  onAdd: (input: unknown) => Promise<ActionResult<{ id: string }>>;
  onDelete: (id: string) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit, reset } = useForm<Values>();

  const tambah = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onAdd({ supplierId, name: v.name, notes: v.notes });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    reset();
    window.location.reload();
  });

  async function hapus(k: SupplierVehicle) {
    if (!window.confirm(`Hapus ${k.name} dari daftar kendaraan pemasok ini?`)) return;
    const hasil = await onDelete(k.id);
    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    window.location.reload();
  }

  return (
    <section className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold">Kendaraan pemasok ({kendaraan.length})</h2>

      {kendaraan.length === 0 ? (
        <p className="text-sm text-muted">
          Belum ada kendaraan. Tambahkan agar bisa dipilih saat mencatat booking manual.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {kendaraan.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="text-sm font-semibold">{k.name}</span>
                {k.notes ? <span className="block text-xs text-muted">{k.notes}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => void hapus(k)}
                aria-label={`Hapus ${k.name}`}
                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={tambah} className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold">Nama kendaraan</span>
          <input
            {...register('name', { required: true })}
            placeholder="Avanza 2022"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">Catatan (opsional)</span>
          <input
            {...register('notes')}
            placeholder="Plat DB 1234 XX"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={mengirim}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden /> {mengirim ? 'Menambah…' : 'Tambah kendaraan'}
          </button>
        </div>
      </form>
    </section>
  );
}
```

- [ ] **Step 3: Halaman daftar pemasok berikut utangnya**

Create `src/app/admin/pemasok/page.tsx`:

```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getSuppliers, getUtangPemasok } from '@/queries/suppliers';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PemasokPage() {
  await requireAdminPage();
  const [daftar, utang] = await Promise.all([getSuppliers(), getUtangPemasok()]);
  const totalUtang = utang.reduce((jml, u) => jml + u.total, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Pemasok</h1>
        <Link
          href="/pemasok/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah pemasok
        </Link>
      </div>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Belum dibayar</h2>
          <p className="text-xl font-black text-amber-700">{formatRupiah(totalUtang)}</p>
        </div>

        {utang.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted">
            Tidak ada utang ke pemasok. Semua pesanan berkendaraan pinjaman sudah lunas.
          </p>
        ) : (
          <div className="space-y-4">
            {utang.map((u) => (
              <div key={u.supplierId} className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                  <Link href={`/pemasok/${u.supplierId}`} className="font-bold text-lians-700">
                    {u.supplierName}
                  </Link>
                  <span className="font-black text-amber-800">{formatRupiah(u.total)}</span>
                </div>
                <ul className="space-y-1.5 text-sm">
                  {u.pesanan.map((p) => (
                    <li key={p.bookingId} className="flex flex-wrap justify-between gap-2">
                      <Link href={`/booking/${p.bookingId}`} className="text-slate-700 underline">
                        {p.bookingCode} · {p.vehicleName} ·{' '}
                        {formatTanggal(new Date(p.startDate), 'id')}
                      </Link>
                      <span className="font-semibold">{formatRupiah(p.cost ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">WhatsApp</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((s) => (
              <tr key={s.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/pemasok/${s.id}`} className="font-semibold text-lians-700">
                    {s.name}
                  </Link>
                </td>
                <td className="p-4">{s.phone ?? '—'}</td>
                <td className="p-4">{s.isActive ? 'Aktif' : 'Nonaktif'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada pemasok.</p>
        ) : null}
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Halaman tambah dan ubah pemasok**

Create `src/app/admin/pemasok/baru/page.tsx`:

```tsx
import { SupplierForm } from '@/components/admin/SupplierForm';
import { createSupplier } from '@/actions/admin-suppliers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PemasokBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Pemasok</h1>
      <SupplierForm supplier={null} onSubmit={createSupplier} />
    </div>
  );
}
```

Create `src/app/admin/pemasok/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getSupplierById, getSupplierVehicles } from '@/queries/suppliers';
import { SupplierForm } from '@/components/admin/SupplierForm';
import { SupplierVehicleList } from '@/components/admin/SupplierVehicleList';
import { DeleteButton } from '@/components/admin/DeleteButton';
import {
  updateSupplier,
  deleteSupplier,
  addSupplierVehicle,
  deleteSupplierVehicle,
} from '@/actions/admin-suppliers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PemasokEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [pemasok, kendaraan] = await Promise.all([getSupplierById(id), getSupplierVehicles(id)]);
  if (!pemasok) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateSupplier(id, input);
  }

  async function hapus() {
    'use server';
    return deleteSupplier(id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">{pemasok.name}</h1>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/pemasok"
          konfirmasi={`Hapus ${pemasok.name} beserta daftar kendaraannya? Riwayat pesanan tetap tersimpan.`}
        />
      </div>

      <SupplierForm supplier={pemasok} onSubmit={simpan} />

      <SupplierVehicleList
        supplierId={id}
        kendaraan={kendaraan}
        onAdd={addSupplierVehicle}
        onDelete={deleteSupplierVehicle}
      />
    </div>
  );
}
```

- [ ] **Step 5: Tambahkan ke navigasi**

Modify `src/components/admin/AdminNav.tsx` — tambahkan impor ikon `Truck` dan sisipkan setelah Pelanggan:

```tsx
  { href: '/pemasok', label: 'Pemasok', Icon: Truck },
```

- [ ] **Step 6: Verifikasi**

Run: `npx tsc --noEmit && npm run build`
Expected: build sukses

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: halaman pemasok dengan daftar utang yang belum dibayar"
```

---

### Task 6: Booking manual

**Files:**
- Create: `src/schemas/manual-booking.ts`, `src/actions/admin-manual-booking.ts`, `src/components/admin/ManualBookingForm.tsx`, `src/app/admin/booking/manual/page.tsx`
- Modify: `src/db/schema.ts`, `src/app/admin/booking/page.tsx`, `src/app/admin/booking/[id]/page.tsx`
- Test: `tests/integration/manual-booking.test.ts`

**Interfaces:**
- Consumes: `cocokkanAtauBuatPelanggan` dari `@/lib/customer-match`; `generateBookingCode` dari `@/lib/booking-code`; `normalizePhone` dari `@/lib/whatsapp`
- Produces:
  - kolom `bookings.source` bertipe `'website' | 'manual'`, bawaan `'website'`
  - `manualBookingInputSchema` dari `@/schemas/manual-booking`
  - `createManualBooking`, `updateSupplierPaid` dari `@/actions/admin-manual-booking`

- [ ] **Step 1: Kolom asal pesanan**

Modify `src/db/schema.ts` — tambahkan enum:

```ts
export const bookingSourceEnum = pgEnum('booking_source', ['website', 'manual']);
```

Pada tabel `bookings`, tambahkan setelah `status`:

```ts
  source: bookingSourceEnum('source').notNull().default('website'),
```

- [ ] **Step 2: Skema booking manual**

Create `src/schemas/manual-booking.ts`:

```ts
import { z } from 'zod';

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

/**
 * Berbeda dari booking website: tanggal hanya keterangan, dan total harga
 * diketik admin. Booking manual justru dipakai untuk kasus yang tidak muat di
 * rumus — sewa campuran, harga negosiasi, paket khusus.
 */
export const manualBookingInputSchema = z
  .object({
    customerName: z.string().trim().min(2, 'Nama pelanggan wajib diisi').max(100),
    phone: z
      .string()
      .trim()
      .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid'),
    email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),

    serviceType: z.enum(['self-drive', 'with-driver', 'tourism', 'travel']),
    itemName: z.string().trim().min(2, 'Keterangan pesanan wajib diisi').max(200),

    startDate: tanggal,
    endDate: z.union([z.literal(''), tanggal]).optional(),

    // Minimal 1, bukan 0: form mengirim 0 untuk kolom yang dikosongkan, jadi
    // batas 0 akan meloloskan pesanan tanpa harga tanpa satu pun pesan galat.
    totalPrice: z.coerce.number().int().min(1, 'Total harga wajib diisi'),

    asalKendaraan: z.enum(['sendiri', 'pemasok']),
    // Boleh kosong: sebagian pesanan manual memang tidak terkait satu unit
    // tertentu — paket gabungan, atau kendaraan yang belum terdaftar di armada.
    vehicleId: z.union([z.literal(''), z.string().uuid()]).optional(),
    supplierVehicleId: z.union([z.literal(''), z.string().uuid()]).optional(),
    supplierCost: z.union([z.literal(''), z.coerce.number().int().min(0)]).optional(),
    supplierPaid: z.boolean().default(false),

    notes: z.string().max(2000).optional(),
    adminNotes: z.string().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.asalKendaraan !== 'pemasok') return;

    if (!data.supplierVehicleId) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplierVehicleId'],
        message: 'Pilih kendaraan pemasok',
      });
    }
    // Tanpa nominal, penanda lunas hanya menghasilkan hitungan pesanan —
    // bukan angka rupiah yang bisa ditagih.
    if (data.supplierCost === '' || data.supplierCost === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplierCost'],
        message: 'Isi biaya yang dibayar ke pemasok',
      });
    }
  });

export type ManualBookingInput = z.infer<typeof manualBookingInputSchema>;
```

- [ ] **Step 3: Server Action booking manual**

Create `src/actions/admin-manual-booking.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings, supplierVehicles, suppliers } from '@/db/schema';
import { manualBookingInputSchema } from '@/schemas/manual-booking';
import { generateBookingCode } from '@/lib/booking-code';
import { cocokkanAtauBuatPelanggan } from '@/lib/customer-match';
import { normalizePhone } from '@/lib/whatsapp';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createManualBooking(
  input: unknown,
): Promise<ActionResult<{ id: string; bookingCode: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = manualBookingInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const data = parsed.data;
  const dariPemasok = data.asalKendaraan === 'pemasok';

  let supplierNameSnapshot: string | null = null;
  if (dariPemasok && data.supplierVehicleId) {
    const [k] = await db
      .select({ pemasok: suppliers.name, kendaraan: supplierVehicles.name })
      .from(supplierVehicles)
      .innerJoin(suppliers, eq(supplierVehicles.supplierId, suppliers.id))
      .where(eq(supplierVehicles.id, data.supplierVehicleId))
      .limit(1);

    if (!k) return fail('Kendaraan pemasok tidak ditemukan.');
    supplierNameSnapshot = k.pemasok;
  }

  const customerId = await cocokkanAtauBuatPelanggan({
    name: data.customerName,
    phone: data.phone,
    email: data.email,
  });

  const bookingCode = generateBookingCode(new Date());

  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode,
      customerName: data.customerName,
      phone: normalizePhone(data.phone),
      email: data.email || null,
      customerId,
      serviceType: data.serviceType,
      // Tautan ke armada hanya untuk kendaraan sendiri; nama tetap disalin
      // terpisah agar keterangan yang diketik admin tidak hilang saat mobilnya
      // kelak dihapus dari armada.
      vehicleId: dariPemasok ? null : data.vehicleId || null,
      vehicleNameSnapshot: data.itemName,
      startDate: data.startDate,
      endDate: data.endDate || null,
      // Harga diketik admin, tidak dihitung dari tanggal. Rincian sengaja
      // dikosongkan karena tidak ada rumus di baliknya.
      totalPrice: data.totalPrice,
      priceBreakdown: null,
      supplierVehicleId: dariPemasok ? data.supplierVehicleId || null : null,
      supplierNameSnapshot,
      supplierCost: dariPemasok && data.supplierCost !== '' ? Number(data.supplierCost) : null,
      supplierPaid: dariPemasok ? data.supplierPaid : false,
      notes: data.notes || null,
      adminNotes: data.adminNotes || null,
      status: 'confirmed',
      source: 'manual',
    })
    .returning({ id: bookings.id });

  revalidatePath('/booking');
  revalidatePath('/pemasok');
  revalidatePath('/');
  return ok({ id: row.id, bookingCode });
}

export async function updateSupplierPaid(
  id: string,
  lunas: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = z.boolean().safeParse(lunas);
  if (!parsed.success) return fail('Nilai status pembayaran tidak dikenal.');

  const [row] = await db
    .update(bookings)
    .set({ supplierPaid: parsed.data, updatedAt: new Date() })
    .where(eq(bookings.id, id))
    .returning({ id: bookings.id });

  if (!row) return fail('Pesanan tidak ditemukan.');

  revalidatePath('/pemasok');
  revalidatePath(`/booking/${id}`);
  return ok({ id: row.id });
}
```

- [ ] **Step 4: Migrasi**

```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 5: Tes integrasi booking manual**

Create `tests/integration/manual-booking.test.ts`:

```ts
import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { bookings, customers, suppliers, vehicles } = await import('@/db/schema');
const { createManualBooking, updateSupplierPaid } = await import(
  '@/actions/admin-manual-booking'
);
const { createSupplier, addSupplierVehicle } = await import('@/actions/admin-suppliers');
const { getUtangPemasok } = await import('@/queries/suppliers');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const pesananDibuat: string[] = [];
const pemasokDibuat: string[] = [];
const pelangganDibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

async function siapkanPemasok() {
  bersesi();
  const p = await createSupplier({ name: `Pemasok Manual ${Date.now()}` });
  if (!p.ok) throw new Error('gagal membuat pemasok uji');
  pemasokDibuat.push(p.data.id);

  const k = await addSupplierVehicle({ supplierId: p.data.id, name: 'Avanza Pinjaman' });
  if (!k.ok) throw new Error('gagal membuat kendaraan pemasok uji');
  return { supplierId: p.data.id, supplierVehicleId: k.data.id };
}

jalankan('booking manual', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const hasil = await createManualBooking({
      customerName: 'Tak Boleh',
      phone: nomorUji(),
      serviceType: 'self-drive',
      itemName: 'Avanza',
      startDate: '2099-09-01',
      totalPrice: 500000,
      asalKendaraan: 'sendiri',
    });
    expect(hasil.ok).toBe(false);
  });

  it('menyimpan harga yang diketik admin apa adanya, tanpa menghitung dari tanggal', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Pelanggan Manual',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Innova + sopir, paket khusus',
      startDate: '2099-09-01',
      endDate: '2099-09-10',
      totalPrice: 1234567,
      asalKendaraan: 'sendiri',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    // Sepuluh hari selisih tanggal tidak boleh memengaruhi angkanya sama sekali.
    expect(row.totalPrice).toBe(1234567);
    expect(row.priceBreakdown).toBeNull();
    expect(row.source).toBe('manual');
    expect(row.status).toBe('confirmed');
  });

  it('membuat catatan pelanggan dari booking manual', async () => {
    bersesi();
    const nomor = nomorUji();
    const hasil = await createManualBooking({
      customerName: 'Pelanggan Baru Manual',
      phone: nomor,
      serviceType: 'self-drive',
      itemName: 'Brio',
      startDate: '2099-09-01',
      totalPrice: 350000,
      asalKendaraan: 'sendiri',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.customerId).toBeTruthy();
    if (row.customerId) pelangganDibuat.push(row.customerId);
  });

  it('menolak pesanan berpemasok tanpa nominal biaya', async () => {
    const { supplierVehicleId } = await siapkanPemasok();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Pemasok',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 700000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.supplierCost?.[0]).toMatch(/biaya/i);
  });

  it('mencatat dua angka terpisah dan memunculkan utang ke pemasok', async () => {
    const { supplierId, supplierVehicleId } = await siapkanPemasok();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Margin',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 700000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 450000,
      supplierPaid: false,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.totalPrice).toBe(700000);
    expect(row.supplierCost).toBe(450000);
    expect(row.supplierPaid).toBe(false);
    expect(row.supplierNameSnapshot).toBeTruthy();

    const utang = await getUtangPemasok();
    expect(utang.find((u) => u.supplierId === supplierId)?.total).toBe(450000);
  });

  it('menandai lunas menghapus pesanan itu dari daftar utang', async () => {
    const { supplierId, supplierVehicleId } = await siapkanPemasok();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Lunas',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 800000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 500000,
      supplierPaid: false,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    expect(await updateSupplierPaid(hasil.data.id, true)).toMatchObject({ ok: true });

    const utang = await getUtangPemasok();
    expect(utang.find((u) => u.supplierId === supplierId)).toBeUndefined();
  });

  it('tidak menyimpan data pemasok bila kendaraannya milik sendiri', async () => {
    bersesi();
    const hasil = await createManualBooking({
      customerName: 'Uji Sendiri',
      phone: nomorUji(),
      serviceType: 'self-drive',
      itemName: 'Rush milik sendiri',
      startDate: '2099-09-01',
      totalPrice: 500000,
      asalKendaraan: 'sendiri',
      // Nilai-nilai ini sengaja dikirim; harus diabaikan seluruhnya.
      supplierCost: 999999,
      supplierPaid: true,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.supplierVehicleId).toBeNull();
    expect(row.supplierCost).toBeNull();
    expect(row.supplierPaid).toBe(false);
  });

  it('menautkan armada LIANS bila unitnya dipilih, tanpa menimpa keterangan', async () => {
    bersesi();
    const [armada] = await db.select().from(vehicles).limit(1);
    expect(armada).toBeTruthy();

    const hasil = await createManualBooking({
      customerName: 'Uji Armada',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Paket 3 hari harga negosiasi',
      startDate: '2099-09-01',
      totalPrice: 2000000,
      asalKendaraan: 'sendiri',
      vehicleId: armada.id,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.vehicleId).toBe(armada.id);
    // Keterangan yang diketik admin menang atas nama unit di tabel armada.
    expect(row.vehicleNameSnapshot).toBe('Paket 3 hari harga negosiasi');
  });

  it('tidak menautkan armada bila kendaraannya dari pemasok', async () => {
    const { supplierVehicleId } = await siapkanPemasok();
    bersesi();
    const [armada] = await db.select().from(vehicles).limit(1);

    const hasil = await createManualBooking({
      customerName: 'Uji Campur',
      phone: nomorUji(),
      serviceType: 'with-driver',
      itemName: 'Avanza pinjaman',
      startDate: '2099-09-01',
      totalPrice: 700000,
      asalKendaraan: 'pemasok',
      supplierVehicleId,
      supplierCost: 400000,
      // Sengaja dikirim bersamaan; kendaraan tidak boleh tercatat dua asal.
      vehicleId: armada.id,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.vehicleId).toBeNull();
    expect(row.supplierVehicleId).toBe(supplierVehicleId);
  });
});

afterAll(async () => {
  for (const id of pesananDibuat) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of pemasokDibuat) await db.delete(suppliers).where(eq(suppliers.id, id));
  for (const id of pelangganDibuat) await db.delete(customers).where(eq(customers.id, id));
});
```

- [ ] **Step 6: Jalankan tes**

Run: `npm test -- tests/integration/manual-booking.test.ts`
Expected: PASS, 7 tes

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: booking manual dengan harga ketikan admin dan pelacakan pemasok"
```

---

### Task 7: Form dan halaman booking manual

**Files:**
- Create: `src/components/admin/ManualBookingForm.tsx`, `src/app/admin/booking/manual/page.tsx`
- Modify: `src/app/admin/booking/page.tsx`, `src/app/admin/booking/[id]/page.tsx`

**Interfaces:**
- Consumes: `createManualBooking`, `updateSupplierPaid` dari `@/actions/admin-manual-booking`; `getAllSupplierVehicles` dari `@/queries/suppliers`; `getCustomers` dari `@/queries/customers`; `getAllVehicles` dari `@/queries/vehicles`
- Produces: `<ManualBookingForm armada={…} kendaraanPemasok={…} pelanggan={…} onSubmit={…} />`

- [ ] **Step 1: Form booking manual**

Create `src/components/admin/ManualBookingForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';

export type PilihanKendaraanPemasok = {
  id: string;
  name: string;
  supplierName: string;
};

export type PilihanPelanggan = { id: string; name: string; phone: string; email: string | null };

export type PilihanArmada = { id: string; name: string };

type Values = {
  customerName: string;
  phone: string;
  email: string;
  serviceType: 'self-drive' | 'with-driver' | 'tourism' | 'travel';
  itemName: string;
  startDate: string;
  endDate: string;
  totalPrice: number | '';
  asalKendaraan: 'sendiri' | 'pemasok';
  vehicleId: string;
  supplierVehicleId: string;
  supplierCost: number | '';
  supplierPaid: boolean;
  notes: string;
  adminNotes: string;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function ManualBookingForm({
  armada,
  kendaraanPemasok,
  pelanggan,
  onSubmit,
}: {
  armada: PilihanArmada[];
  kendaraanPemasok: PilihanKendaraanPemasok[];
  pelanggan: PilihanPelanggan[];
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string; bookingCode: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit, watch, setValue, getValues } = useForm<Values>({
    defaultValues: {
      serviceType: 'with-driver',
      asalKendaraan: 'sendiri',
      vehicleId: '',
      supplierPaid: false,
      totalPrice: '',
      supplierCost: '',
    },
  });

  const nilai = watch();
  const dariPemasok = nilai.asalKendaraan === 'pemasok';

  /** Mengisi nama dan email otomatis bila nomornya sudah ada di daftar pelanggan. */
  function cocokkanPelanggan(nomor: string) {
    const bersih = nomor.replace(/\D/g, '');
    if (bersih.length < 8) return;

    const ketemu = pelanggan.find((p) => p.phone.endsWith(bersih.slice(-9)));
    if (!ketemu) return;

    setValue('customerName', ketemu.name);
    if (ketemu.email) setValue('email', ketemu.email);
    toast.info(`Pelanggan dikenali: ${ketemu.name}`);
  }

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      totalPrice: v.totalPrice === '' ? 0 : Number(v.totalPrice),
      supplierCost: v.supplierCost === '' ? '' : Number(v.supplierCost),
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([f, p]) =>
        toast.error(`${f}: ${p.join(', ')}`),
      );
      return;
    }

    toast.success(`Pesanan ${hasil.data.bookingCode} tercatat.`);
    window.location.href = `/booking/${hasil.data.id}`;
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Pelanggan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
            <input
              {...register('phone', { required: true })}
              onBlur={(e) => cocokkanPelanggan(e.target.value)}
              placeholder="081234567890"
              className={kelas}
            />
            <span className="mt-1 block text-xs text-muted">
              Bila nomor ini sudah pernah memesan, nama akan terisi sendiri.
            </span>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Nama</span>
            <input {...register('customerName', { required: true })} className={kelas} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Email (opsional)</span>
            <input type="email" {...register('email')} className={kelas} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Pesanan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold">Jenis layanan</span>
            <select {...register('serviceType')} className={kelas}>
              <option value="self-drive">Lepas kunci</option>
              <option value="with-driver">Dengan sopir</option>
              <option value="tourism">Bus / Hiace pariwisata</option>
              <option value="travel">Antar-jemput / travel</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Keterangan pesanan</span>
            <input
              {...register('itemName', { required: true })}
              placeholder="Innova Zenix + sopir, 3 hari"
              className={kelas}
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Tanggal mulai</span>
            <input type="date" {...register('startDate', { required: true })} className={kelas} />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Tanggal selesai (opsional)</span>
            <input type="date" {...register('endDate')} className={kelas} />
          </label>
        </div>

        <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">
          Tanggal di sini hanya keterangan untuk rekap internal. Harga tidak dihitung darinya —
          Anda yang menentukan totalnya.
        </p>

        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-semibold">Total harga ke pelanggan (Rp)</span>
          <input
            type="number"
            min={0}
            step={50000}
            {...register('totalPrice', { required: true })}
            className={kelas}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Kendaraan</h2>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Asal kendaraan</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="sendiri" {...register('asalKendaraan')} /> Milik LIANS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="pemasok" {...register('asalKendaraan')} /> Dari pemasok
            </label>
          </div>
        </fieldset>

        {dariPemasok ? null : (
          <label className="block max-w-sm">
            <span className="mb-1 block text-sm font-semibold">Unit armada (opsional)</span>
            <select
              {...register('vehicleId')}
              onChange={(e) => {
                setValue('vehicleId', e.target.value);
                const unit = armada.find((a) => a.id === e.target.value);
                // Hanya mengisi keterangan yang masih kosong: admin yang sudah
                // menulis "paket 3 hari harga negosiasi" tidak boleh kehilangan
                // kalimatnya hanya karena memilih unit.
                if (unit && !getValues('itemName')) setValue('itemName', unit.name);
              }}
              className={kelas}
            >
              <option value="">Tidak terkait unit tertentu</option>
              {armada.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">
              Menautkan pesanan ke armada LIANS untuk keperluan rekap. Keterangan pesanan di atas
              tetap yang tampil.
            </span>
          </label>
        )}

        {dariPemasok ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-semibold">Kendaraan pemasok</span>
              <select {...register('supplierVehicleId')} className={kelas}>
                <option value="">Pilih kendaraan…</option>
                {kendaraanPemasok.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.supplierName} — {k.name}
                  </option>
                ))}
              </select>
              {kendaraanPemasok.length === 0 ? (
                <span className="mt-1 block text-xs text-amber-700">
                  Belum ada kendaraan pemasok. Tambahkan lebih dulu di menu Pemasok.
                </span>
              ) : null}
            </label>

            <label>
              <span className="mb-1 block text-sm font-semibold">Biaya ke pemasok (Rp)</span>
              <input type="number" min={0} step={50000} {...register('supplierCost')} className={kelas} />
              <span className="mt-1 block text-xs text-muted">
                Total untuk pesanan ini, bukan per hari. Selisihnya dengan harga pelanggan adalah
                margin Anda.
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...register('supplierPaid')} />
              Sudah dibayar ke pemasok
            </label>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Catatan</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Catatan dari pelanggan</span>
          <textarea rows={2} {...register('notes')} className={kelas} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Catatan internal</span>
          <textarea rows={2} {...register('adminNotes')} className={kelas} />
        </label>
      </section>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan pesanan'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Halaman booking manual**

Create `src/app/admin/booking/manual/page.tsx`:

```tsx
import { ManualBookingForm } from '@/components/admin/ManualBookingForm';
import { createManualBooking } from '@/actions/admin-manual-booking';
import { getAllSupplierVehicles } from '@/queries/suppliers';
import { getCustomers } from '@/queries/customers';
import { getAllVehicles } from '@/queries/vehicles';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function BookingManualPage() {
  await requireAdminPage();
  const [armada, kendaraanPemasok, pelanggan] = await Promise.all([
    getAllVehicles(),
    getAllSupplierVehicles(),
    getCustomers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black">Catat Booking Manual</h1>
        <p className="mt-1 text-sm text-muted">
          Untuk pesanan yang masuk lewat telepon atau tatap muka, bukan lewat situs.
        </p>
      </div>

      <ManualBookingForm
        armada={armada.map((v) => ({ id: v.id, name: v.name }))}
        kendaraanPemasok={kendaraanPemasok}
        pelanggan={pelanggan.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
        }))}
        onSubmit={createManualBooking}
      />
    </div>
  );
}
```

- [ ] **Step 3: Tombol dan penanda asal di daftar booking**

Modify `src/app/admin/booking/page.tsx` — ganti judul halaman dengan judul plus tombol:

```tsx
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Booking</h1>
        <Link
          href="/booking/manual"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Catat booking manual
        </Link>
      </div>
```

Tambahkan impor `import { Plus } from 'lucide-react';`.

Tambahkan kolom asal pada tabel — pada `<thead>` setelah Kode:

```tsx
              <th className="p-4">Asal</th>
```

Pada `<tbody>` setelah sel kode:

```tsx
                <td className="p-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      b.source === 'manual'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-lians-50 text-lians-700'
                    }`}
                  >
                    {b.source === 'manual' ? 'Manual' : 'Website'}
                  </span>
                </td>
```

- [ ] **Step 4: Tampilkan data pemasok di detail pesanan**

Modify `src/app/admin/booking/[id]/page.tsx` — pada daftar `baris`, tambahkan sebelum `['Dibuat', …]`:

```ts
    ['Asal pesanan', booking.source === 'manual' ? 'Dicatat manual oleh staf' : 'Dari situs'],
```

Setelah `</section>` penutup bagian "Harga saat dipesan" — masih di dalam `<div className="space-y-6">` kolom kiri — tambahkan bagian pemasok:

```tsx
          {booking.supplierVehicleId || booking.supplierNameSnapshot ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-bold">Kendaraan dari pemasok</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">Pemasok</dt>
                  <dd className="font-medium">{booking.supplierNameSnapshot ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Biaya ke pemasok</dt>
                  <dd className="font-medium">
                    {booking.supplierCost === null ? '—' : formatRupiah(booking.supplierCost)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Margin</dt>
                  <dd className="font-medium">
                    {booking.totalPrice !== null && booking.supplierCost !== null
                      ? formatRupiah(booking.totalPrice - booking.supplierCost)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Status pembayaran</dt>
                  <dd
                    className={`font-semibold ${
                      booking.supplierPaid ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {booking.supplierPaid ? 'Sudah dibayar' : 'Belum dibayar'}
                  </dd>
                </div>
              </dl>

              <form action={tandaiLunas} className="mt-4">
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400"
                >
                  {booking.supplierPaid ? 'Tandai belum dibayar' : 'Tandai sudah dibayar'}
                </button>
              </form>
            </section>
          ) : null}
```

Tambahkan Server Action **setelah** `const booking = …` diambil (ia perlu membaca status sekarang), tepat sebelum `const rincian = booking.priceBreakdown;`:

```ts
  const sudahLunas = booking.supplierPaid;

  // Tidak mengembalikan ActionResult: prop `action` pada <form> hanya menerima
  // fungsi yang menghasilkan void. Pesan galat tidak diperlukan di sini karena
  // tombolnya hanya membalik satu boolean.
  async function tandaiLunas() {
    'use server';
    await updateSupplierPaid(id, !sudahLunas);
  }
```

Tambahkan impor `import { updateSupplierPaid } from '@/actions/admin-manual-booking';`.

- [ ] **Step 5: Verifikasi**

Run: `npx tsc --noEmit && npm run build`
Expected: build sukses, rute `/admin/booking/manual` muncul

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: form booking manual dan tampilan pemasok pada detail pesanan"
```

---

### Task 8: Rekap keuangan khusus super admin

**Files:**
- Create: `src/queries/rekap.ts`, `src/app/admin/rekap/page.tsx`
- Modify: `src/app/admin/page.tsx`, `src/components/admin/AdminNav.tsx`
- Test: `tests/integration/rekap.test.ts`

**Interfaces:**
- Consumes: `requireSuperAdmin`, `requireSuperAdminPage`, `sesiSekarang` dari `@/actions/auth-guard`
- Produces: `hitungRekap(dari: Date, sampai: Date)` dari `@/queries/rekap` mengembalikan `{ jumlahPesanan, jumlahWebsite, jumlahManual, pendapatan, biayaPemasok, margin, utangBelumLunas }`

- [ ] **Step 1: Kueri rekap**

Create `src/queries/rekap.ts`:

```ts
import { and, eq, gte, isNotNull, lte, ne, sql } from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { requireSuperAdmin } from '@/actions/auth-guard';

export type Rekap = {
  jumlahPesanan: number;
  jumlahWebsite: number;
  jumlahManual: number;
  pendapatan: number;
  biayaPemasok: number;
  margin: number;
  utangBelumLunas: number;
};

/**
 * Angka keuangan untuk satu rentang tanggal, berdasarkan tanggal pesanan dibuat.
 *
 * Hanya pesanan berstatus confirmed dan completed yang dihitung sebagai
 * pendapatan: yang masih menunggu belum tentu jadi, dan yang dibatalkan jelas
 * tidak menghasilkan apa-apa.
 *
 * Penjaga peran ada di dalam fungsi ini, bukan hanya di halaman pemanggilnya.
 * Selama angka uang hanya dapat lahir dari sini, tidak ada halaman atau action
 * baru yang bisa membocorkannya karena penulisnya lupa memasang penjaga.
 */
export async function hitungRekap(dari: Date, sampai: Date): Promise<Rekap> {
  await requireSuperAdmin();

  const rentang = and(gte(bookings.createdAt, dari), lte(bookings.createdAt, sampai));
  const daftar = await db.select().from(bookings).where(rentang);

  const dihitung = daftar.filter((b) => b.status === 'confirmed' || b.status === 'completed');

  const pendapatan = dihitung.reduce((n, b) => n + (b.totalPrice ?? 0), 0);
  const biayaPemasok = dihitung.reduce((n, b) => n + (b.supplierCost ?? 0), 0);

  // Utang dihitung dari seluruh pesanan yang belum lunas, tanpa batas tanggal:
  // utang tahun lalu tetap utang hari ini.
  const [utang] = await db
    .select({ total: sql<number>`coalesce(sum(${bookings.supplierCost}), 0)::int` })
    .from(bookings)
    .where(
      and(
        eq(bookings.supplierPaid, false),
        isNotNull(bookings.supplierCost),
        ne(bookings.status, 'cancelled'),
      ),
    );

  return {
    jumlahPesanan: dihitung.length,
    jumlahWebsite: dihitung.filter((b) => b.source === 'website').length,
    jumlahManual: dihitung.filter((b) => b.source === 'manual').length,
    pendapatan,
    biayaPemasok,
    margin: pendapatan - biayaPemasok,
    utangBelumLunas: utang?.total ?? 0,
  };
}
```

- [ ] **Step 2: Halaman rekap**

Create `src/app/admin/rekap/page.tsx`:

```tsx
import { hitungRekap } from '@/queries/rekap';
import { formatRupiah } from '@/lib/format';
import { requireSuperAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

function rentangBulan(param?: string): { dari: Date; sampai: Date; label: string } {
  const acuan = param && /^\d{4}-\d{2}$/.test(param) ? new Date(`${param}-01`) : new Date();
  const dari = new Date(acuan.getFullYear(), acuan.getMonth(), 1);
  const sampai = new Date(acuan.getFullYear(), acuan.getMonth() + 1, 0, 23, 59, 59);
  const label = dari.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  return { dari, sampai, label };
}

export default async function RekapPage({
  searchParams,
}: {
  searchParams: Promise<{ bulan?: string }>;
}) {
  await requireSuperAdminPage();

  const { bulan } = await searchParams;
  const { dari, sampai, label } = rentangBulan(bulan);
  const rekap = await hitungRekap(dari, sampai);

  const kartu = [
    { label: 'Pendapatan', nilai: formatRupiah(rekap.pendapatan), tekan: true },
    { label: 'Biaya ke pemasok', nilai: formatRupiah(rekap.biayaPemasok) },
    { label: 'Margin', nilai: formatRupiah(rekap.margin), tekan: true },
    { label: 'Utang belum dibayar', nilai: formatRupiah(rekap.utangBelumLunas) },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Rekap Keuangan</h1>
          <p className="text-sm text-muted">{label}</p>
        </div>
        <form method="get">
          <input
            type="month"
            name="bulan"
            defaultValue={`${dari.getFullYear()}-${String(dari.getMonth() + 1).padStart(2, '0')}`}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="ml-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400"
          >
            Tampilkan
          </button>
        </form>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <div
            key={k.label}
            className={`rounded-2xl border p-5 ${
              k.tekan ? 'border-lians-200 bg-lians-50' : 'border-slate-200 bg-white'
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-2xl font-black">{k.nilai}</p>
          </div>
        ))}
      </div>

      <section className="max-w-xl rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 font-bold">Asal pesanan</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Dari situs</dt>
            <dd className="font-semibold">{rekap.jumlahWebsite}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Dicatat manual</dt>
            <dd className="font-semibold">{rekap.jumlahManual}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
            <dt>Total pesanan terkonfirmasi</dt>
            <dd>{rekap.jumlahPesanan}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-muted">
          Pesanan yang masih menunggu konfirmasi dan yang dibatalkan tidak dihitung.
        </p>
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Sembunyikan angka uang dari admin biasa di dasbor**

Modify `src/app/admin/page.tsx` — ubah baris impor penjaga menjadi:

```tsx
import { requireAdminPage, sesiSekarang } from '@/actions/auth-guard';
```

Sisipkan pembacaan peran tepat setelah `await requireAdminPage();`:

```tsx
  const superAdmin = (await sesiSekarang())?.role === 'super_admin';
```

Ganti penyusunan `kartu` seluruhnya:

```tsx
  const kartu = [
    { label: 'Menunggu konfirmasi', nilai: String(pending.length) },
    { label: 'Pesanan bulan ini', nilai: String(bulanIni.length) },
    // Nilai rupiah hanya untuk super admin. Admin biasa tetap melihat pesanan
    // satu per satu berikut harganya — yang ditutup hanya angka totalnya.
    ...(superAdmin
      ? [{ label: 'Nilai pesanan terkonfirmasi', nilai: formatRupiah(nilaiBulanIni) }]
      : []),
    {
      label: 'Kendaraan tayang',
      nilai: `${armada.filter((v) => v.isPublished).length} / ${armada.length}`,
    },
  ];
```

`formatRupiah` masih terpakai di daftar pesanan di bawahnya, jadi impornya tetap.

- [ ] **Step 4: Tampilkan menu Rekap hanya untuk super admin**

Modify `src/components/admin/AdminNav.tsx` — ganti bagian impor ikon, konstanta `ITEM`, dan tanda tangan komponen. `ITEM` pindah ke dalam komponen karena isinya kini bergantung pada prop:

```tsx
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Users,
  Truck,
  Wallet,
  Route,
  Star,
  Settings,
  LogOut,
} from 'lucide-react';
```

Hapus `const ITEM = [...]` di tingkat modul, lalu ganti awal komponen menjadi:

```tsx
export function AdminNav({
  email,
  pendingCount,
  superAdmin,
}: {
  email: string;
  pendingCount: number;
  superAdmin: boolean;
}) {
  const pathname = usePathname();

  const ITEM = [
    { href: '/', label: 'Dasbor', Icon: LayoutDashboard },
    { href: '/armada', label: 'Armada', Icon: Car },
    { href: '/booking', label: 'Booking', Icon: CalendarCheck },
    { href: '/pelanggan', label: 'Pelanggan', Icon: Users },
    { href: '/pemasok', label: 'Pemasok', Icon: Truck },
    // Menu ini disembunyikan, bukan diamankan. Penjaganya ada di halaman
    // /rekap sendiri — menu yang hilang hanya membuat panel lebih rapi.
    ...(superAdmin ? [{ href: '/rekap', label: 'Rekap Keuangan', Icon: Wallet }] : []),
    { href: '/rute', label: 'Rute Travel', Icon: Route },
    { href: '/testimoni', label: 'Testimoni', Icon: Star },
    { href: '/pengaturan', label: 'Pengaturan', Icon: Settings },
  ];
```

Sisa komponen tidak berubah.

Modify `src/app/admin/layout.tsx` — impor penjaga dan teruskan perannya. Tambahkan impor:

```tsx
import { sesiSekarang } from '@/actions/auth-guard';
```

Ganti pengambilan data menjadi:

```tsx
  const [pendingCount, sesi] = await Promise.all([getPendingCount(), sesiSekarang()]);
```

Ganti pemanggilan `<AdminNav />`:

```tsx
            <AdminNav
              email={session.user.email ?? ''}
              pendingCount={pendingCount}
              superAdmin={sesi?.role === 'super_admin'}
            />
```

- [ ] **Step 5: Tes integrasi rekap**

Create `tests/integration/rekap.test.ts`:

```ts
import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { bookings } = await import('@/db/schema');
const { hitungRekap } = await import('@/queries/rekap');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const superAdmin = () =>
  authMock.mockResolvedValue({ user: { id: 'uji', email: 'bos@lians.id', role: 'super_admin' } });

// Acak, bukan berbasis waktu: beberapa pesanan dibuat dalam milidetik yang sama
// di dalam satu tes, dan bookingCode punya batasan unik.
const kode = () => `LNS-REKAP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

async function buatPesanan(over: Partial<typeof bookings.$inferInsert>) {
  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode: kode(),
      customerName: 'Uji Rekap',
      phone: '081234567890',
      serviceType: 'self-drive',
      startDate: '2099-09-01',
      status: 'confirmed',
      ...over,
    })
    .returning({ id: bookings.id });
  dibuat.push(row.id);
  return row.id;
}

jalankan('hitungRekap', () => {
  const dari = new Date(Date.now() - 60 * 60 * 1000);
  const sampai = new Date(Date.now() + 60 * 60 * 1000);

  it('menolak admin biasa, bukan hanya menyembunyikan menunya', async () => {
    authMock.mockResolvedValue({ user: { id: 'staf', email: 'staf@lians.id', role: 'admin' } });
    await expect(hitungRekap(dari, sampai)).rejects.toThrow(/sesi tidak valid/i);
  });

  it('menolak permintaan tanpa sesi sama sekali', async () => {
    authMock.mockResolvedValue(null);
    await expect(hitungRekap(dari, sampai)).rejects.toThrow(/sesi tidak valid/i);
  });

  it('menghitung pendapatan hanya dari pesanan terkonfirmasi dan selesai', async () => {
    superAdmin();
    const sebelum = await hitungRekap(dari, sampai);

    await buatPesanan({ totalPrice: 500000, status: 'confirmed', source: 'website' });
    await buatPesanan({ totalPrice: 300000, status: 'completed', source: 'manual' });
    await buatPesanan({ totalPrice: 900000, status: 'pending', source: 'website' });
    await buatPesanan({ totalPrice: 700000, status: 'cancelled', source: 'website' });

    const sesudah = await hitungRekap(dari, sampai);

    // Hanya 500rb + 300rb yang dihitung; pending dan cancelled diabaikan.
    expect(sesudah.pendapatan - sebelum.pendapatan).toBe(800000);
    expect(sesudah.jumlahPesanan - sebelum.jumlahPesanan).toBe(2);
    expect(sesudah.jumlahWebsite - sebelum.jumlahWebsite).toBe(1);
    expect(sesudah.jumlahManual - sebelum.jumlahManual).toBe(1);
  });

  it('menghitung margin sebagai pendapatan dikurangi biaya pemasok', async () => {
    superAdmin();
    const sebelum = await hitungRekap(dari, sampai);

    await buatPesanan({
      totalPrice: 1000000,
      supplierCost: 600000,
      supplierPaid: false,
      status: 'confirmed',
      source: 'manual',
    });

    const sesudah = await hitungRekap(dari, sampai);

    expect(sesudah.biayaPemasok - sebelum.biayaPemasok).toBe(600000);
    expect(sesudah.margin - sebelum.margin).toBe(400000);
    expect(sesudah.utangBelumLunas - sebelum.utangBelumLunas).toBe(600000);
  });

  it('tidak menghitung pesanan di luar rentang tanggal', async () => {
    superAdmin();
    const rentangLampau = {
      dari: new Date('2000-01-01'),
      sampai: new Date('2000-01-31'),
    };
    const rekap = await hitungRekap(rentangLampau.dari, rentangLampau.sampai);
    expect(rekap.jumlahPesanan).toBe(0);
    expect(rekap.pendapatan).toBe(0);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(bookings).where(eq(bookings.id, id));
});
```

- [ ] **Step 6: Jalankan tes**

Run: `npm test -- tests/integration/rekap.test.ts`
Expected: PASS, 3 tes

- [ ] **Step 7: Verifikasi pembatasan peran secara manual**

Run: `npm run dev`, lalu:

1. Login sebagai `admin@lians.id` (super admin) → menu **Rekap Keuangan** muncul, dasbor menampilkan kartu "Nilai pesanan terkonfirmasi"
2. Buat akun staf baru lewat Pengaturan, login sebagai staf itu → menu Rekap **tidak muncul**, kartu nilai pesanan **tidak muncul**
3. Sebagai staf, buka `admin.lians.id/rekap` langsung → dialihkan ke dasbor, bukan ke login

Expected: ketiganya sesuai.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: rekap keuangan khusus super admin"
```

---

### Task 9: Verifikasi dan penerbitan

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Jalankan tes tanpa database tiga kali**

Run: `for i in 1 2 3; do npm test -- tests/unit tests/properties tests/components 2>&1 | grep -E "^ *Tests +[0-9]"; done`
Expected: tiga baris identik, semua lulus.

- [ ] **Step 2: Jalankan tes integrasi**

Run: `npm test -- tests/integration`
Expected: seluruhnya lulus.

Bila gagal di tempat berbeda-beda tiap jalan, ukur latensi lebih dulu:

```bash
node --env-file=.env.local -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
(async () => { for (let i=0;i<5;i++){const t=Date.now();await sql\`select 1\`;console.log(Date.now()-t,'ms');} })();
"
```

Latensi di atas 5 detik berarti jaringan, bukan kode. Lanjutkan dengan build Vercel sebagai bukti pengganti.

- [ ] **Step 3: Perbarui README**

Modify `README.md` — tambahkan setelah bagian "Keputusan yang perlu diketahui sebelum mengubah kode":

```markdown
**Dua peran: `admin` dan `super_admin`.** Satu-satunya beda: angka rekap uang di
dasbor dan halaman Rekap Keuangan hanya untuk super admin. Admin biasa tetap
melihat pesanan satu per satu berikut harganya, dan tetap boleh mengelola
armada, pemasok, pengaturan, serta akun staf.

**Booking manual berbeda dari booking website.** Tanggalnya hanya keterangan —
harga diketik admin, tidak dihitung dari durasi. Itu memang gunanya: mencatat
sewa campuran, harga negosiasi, dan paket khusus yang tidak muat di rumus.

**Pemasok hanya muncul pada booking manual.** Booking dari situs selalu memakai
armada LIANS sendiri. `supplierCost` adalah total per pesanan, bukan per hari,
dan terpisah dari `totalPrice` yang dibayar pelanggan.

**Nomor telepon pelanggan disimpan ternormalisasi** (`62…`) agar `0811…` dan
`+62811…` tidak menghasilkan dua catatan untuk orang yang sama.
```

- [ ] **Step 4: Commit dan dorong**

```bash
git add -A
git commit -m "docs: README mencakup peran, booking manual, dan pemasok"
git push origin main
```

- [ ] **Step 5: Tunggu deploy**

```bash
until curl -s --max-time 30 https://admin.lians.id/login -o /dev/null -w "%{http_code}" | grep -q 200; do sleep 25; done
echo "deploy selesai"
```

- [ ] **Step 6: Verifikasi produksi**

```bash
PW=$(grep SEED_ADMIN_PASSWORD .env.local | cut -d'"' -f2)
J=/tmp/j2b.txt; rm -f $J
CSRF=$(curl -s -c $J https://admin.lians.id/api/auth/csrf | python3 -c "import sys,json;print(json.load(sys.stdin)['csrfToken'])")
curl -s -o /dev/null -b $J -c $J -X POST https://admin.lians.id/api/auth/callback/credentials \
  --data-urlencode "csrfToken=$CSRF" --data-urlencode "email=admin@lians.id" \
  --data-urlencode "password=$PW" --data-urlencode "redirect=false"

for p in "/" "/pelanggan" "/pemasok" "/booking" "/booking/manual" "/rekap"; do
  printf "%-18s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' -b $J https://admin.lians.id$p)"
done
```

Expected: seluruhnya 200 untuk super admin.

- [ ] **Step 7: Pastikan situs publik tidak terpengaruh**

```bash
for p in "/" "/mobil" "/booking" "/en" "/ko"; do
  printf "%-10s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 https://lians.id$p)"
done
```

Expected: seluruhnya 200. Tahap 2B tidak mengubah apa pun di sisi publik selain penautan pelanggan yang berjalan diam-diam saat pesanan masuk.
