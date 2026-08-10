# LIANS Rental — Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun situs publik `lians.id` empat bahasa (Indonesia, Inggris, Mandarin, Korea) dan panel admin `admin.lians.id` untuk rental mobil LIANS Manado dalam satu aplikasi Next.js, dengan seluruh konten dikelola lewat CRUD di panel admin.

**Architecture:** Satu aplikasi Next.js 16 App Router. `proxy.ts` membaca hostname dan menulis-ulang `admin.*` ke grup rute `(admin)`, host lain ke `(public)/[locale]` sesuai awalan bahasa pada path. Server Component membaca Postgres langsung lewat Drizzle tanpa lapisan REST internal; mutasi lewat Server Action yang memvalidasi dengan skema Zod yang sama dengan form di browser, lalu `revalidatePath`. Logika harga diisolasi sebagai fungsi murni tanpa ketergantungan React maupun database.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui · Drizzle ORM · Neon Postgres · Auth.js v5 · Cloudinary · React Hook Form · Zod · date-fns · lucide-react · Vitest · Testing Library · fast-check · kamus multibahasa buatan sendiri

**Spesifikasi:** `docs/superpowers/specs/2026-08-10-lians-rental-design.md`

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Folder `../website-rental-mobil` adalah **referensi baca-saja** — jangan pernah diubah.
- **Bahasa situs publik:** Indonesia (`id`, bawaan, tanpa awalan URL), Inggris (`en`), Mandarin (`zh`), Korea (`ko`). **Panel admin hanya berbahasa Indonesia.**
- Terjemahan yang belum diisi **selalu jatuh ke bahasa Indonesia**, tidak pernah disembunyikan.
- Nama kendaraan, nama kota dan bandara, nama pelanggan, nomor telepon, alamat, dan seluruh angka harga **tidak diterjemahkan**.
- Mata uang **IDR** di semua bahasa, diformat `Rp 350.000` (pemisah titik, tanpa desimal).
- **Next.js 16**, bukan 15. `create-next-app@latest` memasang 16.3.0. Konsekuensi paling penting: berkas `middleware.ts` kini bernama `proxy.ts` dan fungsinya diekspor sebagai `proxy`. Perilaku, `matcher`, dan pola `request: { headers }` tidak berubah.
- Konfigurasi Vitest berada di `vitest.config.mts` (bukan `.ts`) agar dimuat sebagai ESM tanpa peringatan.
- `next.config.ts` mengunci `turbopack.root` ke akar repositori.
- TypeScript `strict: true`. Tidak ada `any` di kode produksi.
- Path alias `@/*` → `src/*`.
- Semua harga disimpan sebagai **integer rupiah**, tidak pernah float.
- Nama bisnis: **LIANS**. Alamat lengkap, dipakai persis: `Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125`.
- Warna aksen utama: `#2E8BF0` (biru logo LIANS). Tema terang — latar putih/abu netral, teks gelap.
- Hitungan hari sewa: `differenceInCalendarDays(endDate, startDate)`, minimum 1. Sewa 1 Agustus–3 Agustus = **2 hari**.
- Tidak ada teks antarmuka yang ditulis langsung di JSX. Semua lewat kamus `@/i18n` supaya keempat bahasa tidak pernah berbeda isi.
- Tarif sopir global di `siteSettings.driverFeePerDay`; `vehicles.driverFeeOverride` ada di skema tetapi selalu `null` pada rilis ini.
- Total harga **selalu** dihitung ulang di server; angka dari browser tidak pernah dipercaya.
- Commit setiap akhir tugas. Pesan commit berbahasa Indonesia, format `feat:` / `test:` / `chore:` / `fix:`.
- Rahasia (`DATABASE_URL`, `AUTH_SECRET`, kunci Cloudinary) hanya di `.env.local` dan environment variable Vercel — tidak pernah masuk repositori.

## Peta Berkas

```
lians-web/
├── drizzle.config.ts            konfigurasi drizzle-kit
├── proxy.ts                     routing berbasis hostname + bahasa (dulu middleware.ts)
├── vitest.config.ts             jsdom + alias @/
├── src/
│   ├── app/
│   │   ├── layout.tsx           root: font, globals.css
│   │   ├── globals.css          token Tailwind 4 + palet LIANS
│   │   ├── (public)/[locale]/   situs publik lians.id, 4 bahasa
│   │   ├── (admin)/admin/       panel admin.lians.id (Indonesia saja)
│   │   ├── (admin)/login/       login, di luar layout berpenjaga
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── db/
│   │   ├── schema.ts            6 tabel + enum
│   │   ├── index.ts             koneksi Neon serverless
│   │   └── seed.ts              data awal + akun admin pertama
│   ├── i18n/
│   │   ├── config.ts            daftar Locale, label, kode hreflang
│   │   ├── locale-path.ts       baca/tulis awalan bahasa pada URL
│   │   ├── localized.ts         tipe Localized<T> + pickLocale
│   │   ├── messages/            kamus id/en/zh/ko
│   │   └── index.ts             getMessages, fill
│   ├── lib/
│   │   ├── pricing.ts           fungsi murni harga  ← inti
│   │   ├── dates.ts             countRentalDays, formatTanggal per bahasa
│   │   ├── format.ts            formatRupiah
│   │   ├── slug.ts              slugify + penjamin keunikan
│   │   ├── booking-code.ts      LNS-YYYYMMDD-XXXX
│   │   ├── whatsapp.ts          penyusun pesan + tautan wa.me
│   │   ├── rate-limit.ts        pembatas laju berbasis IP
│   │   ├── cloudinary.ts        tanda tangan unggah
│   │   └── auth.ts              konfigurasi Auth.js v5
│   ├── schemas/                 skema Zod dipakai browser + server
│   ├── queries/                 baca database (Server Component)
│   ├── actions/                 tulis database (Server Action)
│   └── components/
│       ├── ui/                  shadcn/ui
│       ├── layout/              Header, Footer
│       ├── vehicle/ booking/ travel/ testimonial/
│       └── admin/               ImageUploader, LocalizedInput, form
└── tests/
    ├── unit/ properties/ components/ integration/
```

Segmen `[locale]` hanya ada di sisi publik. Panel admin tidak berbahasa jamak, jadi rutenya tetap datar — memaksa segmen bahasa ke sana hanya menambah parameter yang selalu bernilai sama.

Pemisahan `queries/` (baca) dan `actions/` (tulis) disengaja: berkas `queries/` aman dipanggil dari Server Component mana pun, sedangkan setiap berkas di `actions/` diawali `'use server'` dan wajib memeriksa sesi. Batas ini membuat lupa-memeriksa-sesi menjadi kesalahan yang terlihat saat membaca kode.

---

## Fase 1 — Fondasi & Logika Murni

### Task 1: Scaffold proyek

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.env.example`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Test: `tests/unit/format.test.ts`
- Create: `src/lib/format.ts`

**Interfaces:**
- Consumes: tidak ada (tugas pertama)
- Produces: `formatRupiah(value: number): string` dari `@/lib/format`; alias `@/*`; perintah `npm test`, `npm run dev`, `npm run build`

- [ ] **Step 1: Scaffold Next.js**

```bash
cd /Users/marchelinoraco/Documents/2026/lians/lians-web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm
```

Jawab `No` bila ditanya soal menimpa berkas yang sudah ada — `docs/` dan `.gitignore` harus tetap utuh.

- [ ] **Step 2: Pasang dependensi**

```bash
npm install drizzle-orm @neondatabase/serverless zod react-hook-form @hookform/resolvers date-fns lucide-react next-auth@beta bcryptjs cloudinary clsx tailwind-merge sonner
npm install -D drizzle-kit vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event fast-check @types/bcryptjs tsx dotenv
```

- [ ] **Step 3: Konfigurasi Vitest**

Create `vitest.config.mts` — ekstensi `.mts`, bukan `.ts`, agar dimuat sebagai ESM tanpa peringatan Vite:

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
  },
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
});
```

Create `tests/setup.ts`:

```ts
import { config } from 'dotenv';
import '@testing-library/jest-dom/vitest';

// Vitest tidak membaca .env.local sendiri. Tanpa ini, tes integrasi
// akan terlewat diam-diam karena DATABASE_URL tidak terlihat.
config({ path: '.env.local', quiet: true });
```

Tambahkan skrip ke `package.json`:

```json
"test": "vitest run",
"test:watch": "vitest",
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:seed": "tsx src/db/seed.ts"
```

- [ ] **Step 4: Tulis tes yang gagal**

Create `tests/unit/format.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatRupiah } from '@/lib/format';

describe('formatRupiah', () => {
  it('memformat ribuan dengan pemisah titik', () => {
    expect(formatRupiah(350000)).toBe('Rp 350.000');
  });

  it('memformat jutaan', () => {
    expect(formatRupiah(1250000)).toBe('Rp 1.250.000');
  });

  it('memformat nol', () => {
    expect(formatRupiah(0)).toBe('Rp 0');
  });
});
```

- [ ] **Step 5: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/format.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/format"`

- [ ] **Step 6: Implementasi minimal**

Create `src/lib/format.ts`:

```ts
export function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}
```

- [ ] **Step 7: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/format.test.ts`
Expected: PASS, 3 tes

- [ ] **Step 8: Buat `.env.example`**

```bash
DATABASE_URL=
AUTH_SECRET=
NEXT_PUBLIC_SITE_URL=https://lians.id
NEXT_PUBLIC_ADMIN_URL=https://admin.lians.id
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=
```

- [ ] **Step 9: Pastikan build lulus**

Run: `npm run build`
Expected: build sukses tanpa error TypeScript

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js 15 + Tailwind 4 + Vitest"
```

---

### Task 2: Util tanggal, slug, dan kode booking

**Files:**
- Create: `src/lib/dates.ts`, `src/lib/slug.ts`, `src/lib/booking-code.ts`
- Test: `tests/unit/dates.test.ts`, `tests/unit/slug.test.ts`, `tests/unit/booking-code.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces:
  - `countRentalDays(start: Date, end: Date): number` — `@/lib/dates`
  - `formatTanggalID(d: Date): string` — `@/lib/dates`
  - `slugify(text: string): string` — `@/lib/slug`
  - `generateBookingCode(now: Date, random?: () => number): string` — `@/lib/booking-code`

- [ ] **Step 1: Tulis tes tanggal yang gagal**

Create `tests/unit/dates.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { countRentalDays, formatTanggalID } from '@/lib/dates';

describe('countRentalDays', () => {
  it('menghitung 1 Agustus sampai 3 Agustus sebagai 2 hari', () => {
    expect(countRentalDays(new Date('2026-08-01'), new Date('2026-08-03'))).toBe(2);
  });

  it('menghitung tanggal yang sama sebagai 1 hari', () => {
    expect(countRentalDays(new Date('2026-08-01'), new Date('2026-08-01'))).toBe(1);
  });

  it('mengembalikan minimum 1 walau tanggal selesai lebih awal', () => {
    expect(countRentalDays(new Date('2026-08-05'), new Date('2026-08-01'))).toBe(1);
  });

  it('mengabaikan jam pada tanggal', () => {
    expect(
      countRentalDays(new Date('2026-08-01T23:00:00'), new Date('2026-08-02T01:00:00')),
    ).toBe(1);
  });
});

describe('formatTanggalID', () => {
  it('memformat dalam bahasa Indonesia', () => {
    expect(formatTanggalID(new Date('2026-08-10'))).toBe('10 Agustus 2026');
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/dates.test.ts`
Expected: FAIL — modul tidak ditemukan

- [ ] **Step 3: Implementasi util tanggal**

Create `src/lib/dates.ts`:

```ts
import { differenceInCalendarDays, format } from 'date-fns';
import { id } from 'date-fns/locale';

/**
 * Jumlah hari sewa = selisih hari kalender, minimum 1.
 * 1 Agustus sampai 3 Agustus = 2 hari (dua periode 24 jam).
 */
export function countRentalDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start));
}

export function formatTanggalID(d: Date): string {
  return format(d, 'd MMMM yyyy', { locale: id });
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/dates.test.ts`
Expected: PASS, 5 tes

- [ ] **Step 5: Tulis tes slug yang gagal**

Create `tests/unit/slug.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { slugify } from '@/lib/slug';

describe('slugify', () => {
  it('mengubah nama mobil jadi slug', () => {
    expect(slugify('Innova Zenix G')).toBe('innova-zenix-g');
  });

  it('membuang tanda baca', () => {
    expect(slugify('All New Brio (2024)')).toBe('all-new-brio-2024');
  });

  it('merapatkan spasi berlebih', () => {
    expect(slugify('  Hiace   Premio  ')).toBe('hiace-premio');
  });

  it('mengembalikan string kosong untuk masukan tanpa huruf', () => {
    expect(slugify('!!!')).toBe('');
  });
});
```

- [ ] **Step 6: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/slug.test.ts`
Expected: FAIL — modul tidak ditemukan

- [ ] **Step 7: Implementasi slugify**

Create `src/lib/slug.ts`:

```ts
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

- [ ] **Step 8: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/slug.test.ts`
Expected: PASS, 4 tes

- [ ] **Step 9: Tulis tes kode booking yang gagal**

Create `tests/unit/booking-code.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { generateBookingCode } from '@/lib/booking-code';

describe('generateBookingCode', () => {
  it('memakai format LNS-YYYYMMDD-XXXX', () => {
    const code = generateBookingCode(new Date('2026-08-10T09:00:00'));
    expect(code).toMatch(/^LNS-20260810-[A-Z2-9]{4}$/);
  });

  it('tidak memakai karakter yang mudah tertukar saat dibacakan', () => {
    for (let i = 0; i < 200; i += 1) {
      const suffix = generateBookingCode(new Date('2026-08-10')).split('-')[2];
      expect(suffix).not.toMatch(/[OIL01]/);
    }
  });

  it('menghasilkan kode berbeda pada tanggal yang sama', () => {
    const codes = new Set(
      Array.from({ length: 50 }, () => generateBookingCode(new Date('2026-08-10'))),
    );
    expect(codes.size).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 10: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/booking-code.test.ts`
Expected: FAIL — modul tidak ditemukan

- [ ] **Step 11: Implementasi kode booking**

Create `src/lib/booking-code.ts`:

```ts
import { format } from 'date-fns';

// Tanpa O, I, L, 0, 1 — kode ini dibacakan lewat telepon dan WhatsApp.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateBookingCode(now: Date, random: () => number = Math.random): string {
  const tanggal = format(now, 'yyyyMMdd');
  let suffix = '';
  for (let i = 0; i < 4; i += 1) {
    suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
  }
  return `LNS-${tanggal}-${suffix}`;
}
```

- [ ] **Step 12: Jalankan seluruh tes**

Run: `npm test`
Expected: PASS semua

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: util tanggal, slug, dan kode booking"
```

---

### Task 3: Fungsi harga (inti sistem)

Ini bagian yang kesalahannya langsung berubah jadi kerugian uang. Diuji dengan property-based testing, bukan hanya contoh kasus.

**Files:**
- Create: `src/lib/pricing.ts`
- Test: `tests/unit/pricing.test.ts`, `tests/properties/pricing.properties.test.ts`

**Interfaces:**
- Consumes: `countRentalDays` dari `@/lib/dates`
- Produces, dari `@/lib/pricing`:
  - `type RateType = '24h' | '12h'`
  - `type VehiclePricing = { rate24h: number; rate12h: number | null; driverFeeOverride: number | null }`
  - `type RentalPriceInput = { vehicle: VehiclePricing; startDate: Date; endDate: Date; rateType: RateType; driverDays: number; driverFeePerDay: number }`
  - `type PriceBreakdown = { days: number; ratePerDay: number; rentalCost: number; driverDays: number; driverFeePerDay: number; driverCost: number; total: number }`
  - `type PricingError = 'RATE_12H_UNAVAILABLE' | 'DRIVER_DAYS_EXCEEDS_DURATION' | 'DRIVER_DAYS_NEGATIVE'`
  - `type PricingResult = { ok: true; breakdown: PriceBreakdown } | { ok: false; error: PricingError }`
  - `calculateRentalPrice(input: RentalPriceInput): PricingResult`
  - `calculateTravelPrice(routePrice: number | null): number | null`

- [ ] **Step 1: Tulis tes contoh kasus yang gagal**

Create `tests/unit/pricing.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import type { VehiclePricing } from '@/lib/pricing';

const innova: VehiclePricing = { rate24h: 700000, rate12h: 500000, driverFeeOverride: null };
const brio: VehiclePricing = { rate24h: 350000, rate12h: null, driverFeeOverride: null };

describe('calculateRentalPrice', () => {
  it('sewa 5 hari dengan sopir 3 hari', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-06'),
      rateType: '24h',
      driverDays: 3,
      driverFeePerDay: 150000,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(5);
    expect(hasil.breakdown.rentalCost).toBe(3500000);
    expect(hasil.breakdown.driverCost).toBe(450000);
    expect(hasil.breakdown.total).toBe(3950000);
  });

  it('paket 12 jam dihitung per hari kalender dengan tarif berbeda', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-04'),
      rateType: '12h',
      driverDays: 0,
      driverFeePerDay: 150000,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(3);
    expect(hasil.breakdown.total).toBe(1500000);
  });

  it('menolak paket 12 jam pada mobil tanpa tarif 12 jam', () => {
    const hasil = calculateRentalPrice({
      vehicle: brio,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-02'),
      rateType: '12h',
      driverDays: 0,
      driverFeePerDay: 150000,
    });

    expect(hasil).toEqual({ ok: false, error: 'RATE_12H_UNAVAILABLE' });
  });

  it('menolak hari sopir melebihi durasi sewa', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-03'),
      rateType: '24h',
      driverDays: 5,
      driverFeePerDay: 150000,
    });

    expect(hasil).toEqual({ ok: false, error: 'DRIVER_DAYS_EXCEEDS_DURATION' });
  });

  it('menolak hari sopir negatif', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-03'),
      rateType: '24h',
      driverDays: -1,
      driverFeePerDay: 150000,
    });

    expect(hasil).toEqual({ ok: false, error: 'DRIVER_DAYS_NEGATIVE' });
  });

  it('memakai driverFeeOverride bila kendaraan punya tarif sopir sendiri', () => {
    const hasil = calculateRentalPrice({
      vehicle: { rate24h: 1500000, rate12h: null, driverFeeOverride: 250000 },
      startDate: new Date('2026-08-01'),
      endDate: new Date('2026-08-02'),
      rateType: '24h',
      driverDays: 1,
      driverFeePerDay: 150000,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.driverCost).toBe(250000);
  });
});

describe('calculateTravelPrice', () => {
  it('mengembalikan tarif rute apa adanya', () => {
    expect(calculateTravelPrice(150000)).toBe(150000);
  });

  it('mengembalikan null bila rute belum bertarif', () => {
    expect(calculateTravelPrice(null)).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/pricing.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/pricing"`

- [ ] **Step 3: Implementasi fungsi harga**

Create `src/lib/pricing.ts`:

```ts
import { countRentalDays } from '@/lib/dates';

export type RateType = '24h' | '12h';

export type VehiclePricing = {
  rate24h: number;
  rate12h: number | null;
  driverFeeOverride: number | null;
};

export type RentalPriceInput = {
  vehicle: VehiclePricing;
  startDate: Date;
  endDate: Date;
  rateType: RateType;
  driverDays: number;
  driverFeePerDay: number;
};

export type PriceBreakdown = {
  days: number;
  ratePerDay: number;
  rentalCost: number;
  driverDays: number;
  driverFeePerDay: number;
  driverCost: number;
  total: number;
};

export type PricingError =
  | 'RATE_12H_UNAVAILABLE'
  | 'DRIVER_DAYS_EXCEEDS_DURATION'
  | 'DRIVER_DAYS_NEGATIVE';

export type PricingResult =
  | { ok: true; breakdown: PriceBreakdown }
  | { ok: false; error: PricingError };

export function calculateRentalPrice(input: RentalPriceInput): PricingResult {
  const { vehicle, startDate, endDate, rateType, driverDays, driverFeePerDay } = input;

  if (rateType === '12h' && vehicle.rate12h === null) {
    return { ok: false, error: 'RATE_12H_UNAVAILABLE' };
  }
  if (driverDays < 0) {
    return { ok: false, error: 'DRIVER_DAYS_NEGATIVE' };
  }

  const days = countRentalDays(startDate, endDate);
  if (driverDays > days) {
    return { ok: false, error: 'DRIVER_DAYS_EXCEEDS_DURATION' };
  }

  const ratePerDay = rateType === '12h' ? (vehicle.rate12h as number) : vehicle.rate24h;
  const effectiveDriverFee = vehicle.driverFeeOverride ?? driverFeePerDay;

  const rentalCost = days * ratePerDay;
  const driverCost = driverDays * effectiveDriverFee;

  return {
    ok: true,
    breakdown: {
      days,
      ratePerDay,
      rentalCost,
      driverDays,
      driverFeePerDay: effectiveDriverFee,
      driverCost,
      total: rentalCost + driverCost,
    },
  };
}

/** Tarif travel bersifat tetap sekali jalan — tidak dikali hari, tidak kena biaya sopir. */
export function calculateTravelPrice(routePrice: number | null): number | null {
  return routePrice;
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/pricing.test.ts`
Expected: PASS, 8 tes

- [ ] **Step 5: Tulis property-based test**

Create `tests/properties/pricing.properties.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { addDays } from 'date-fns';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';

const rupiah = fc.integer({ min: 50_000, max: 5_000_000 });
const awal = new Date('2026-08-01');

const skenario = fc
  .record({
    rate24h: rupiah,
    rate12h: fc.option(rupiah, { nil: null }),
    durasi: fc.integer({ min: 1, max: 60 }),
    driverFeePerDay: rupiah,
    pakai12h: fc.boolean(),
  })
  .chain((r) =>
    fc.record({
      base: fc.constant(r),
      driverDays: fc.integer({ min: 0, max: r.durasi }),
    }),
  );

describe('properti harga sewa', () => {
  it('total tidak pernah negatif', () => {
    fc.assert(
      fc.property(skenario, ({ base, driverDays }) => {
        const hasil = calculateRentalPrice({
          vehicle: { rate24h: base.rate24h, rate12h: base.rate12h, driverFeeOverride: null },
          startDate: awal,
          endDate: addDays(awal, base.durasi),
          rateType: base.pakai12h && base.rate12h !== null ? '12h' : '24h',
          driverDays,
          driverFeePerDay: base.driverFeePerDay,
        });
        if (!hasil.ok) return true;
        return hasil.breakdown.total >= 0;
      }),
    );
  });

  it('total selalu sama dengan jumlah komponen rinciannya', () => {
    fc.assert(
      fc.property(skenario, ({ base, driverDays }) => {
        const hasil = calculateRentalPrice({
          vehicle: { rate24h: base.rate24h, rate12h: base.rate12h, driverFeeOverride: null },
          startDate: awal,
          endDate: addDays(awal, base.durasi),
          rateType: base.pakai12h && base.rate12h !== null ? '12h' : '24h',
          driverDays,
          driverFeePerDay: base.driverFeePerDay,
        });
        if (!hasil.ok) return true;
        const b = hasil.breakdown;
        return b.total === b.rentalCost + b.driverCost;
      }),
    );
  });

  it('menambah durasi tidak pernah menurunkan total', () => {
    fc.assert(
      fc.property(rupiah, rupiah, fc.integer({ min: 1, max: 30 }), (rate24h, fee, durasi) => {
        const buat = (d: number) =>
          calculateRentalPrice({
            vehicle: { rate24h, rate12h: null, driverFeeOverride: null },
            startDate: awal,
            endDate: addDays(awal, d),
            rateType: '24h',
            driverDays: 0,
            driverFeePerDay: fee,
          });
        const pendek = buat(durasi);
        const panjang = buat(durasi + 1);
        if (!pendek.ok || !panjang.ok) return false;
        return panjang.breakdown.total >= pendek.breakdown.total;
      }),
    );
  });

  it('hari sopir melebihi durasi selalu ditolak', () => {
    fc.assert(
      fc.property(
        rupiah,
        rupiah,
        fc.integer({ min: 1, max: 30 }),
        fc.integer({ min: 1, max: 30 }),
        (rate24h, fee, durasi, kelebihan) => {
          const hasil = calculateRentalPrice({
            vehicle: { rate24h, rate12h: null, driverFeeOverride: null },
            startDate: awal,
            endDate: addDays(awal, durasi),
            rateType: '24h',
            driverDays: durasi + kelebihan,
            driverFeePerDay: fee,
          });
          return !hasil.ok && hasil.error === 'DRIVER_DAYS_EXCEEDS_DURATION';
        },
      ),
    );
  });

  it('paket 12 jam pada mobil tanpa tarif 12 jam selalu ditolak', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 1, max: 30 }), (rate24h, durasi) => {
        const hasil = calculateRentalPrice({
          vehicle: { rate24h, rate12h: null, driverFeeOverride: null },
          startDate: awal,
          endDate: addDays(awal, durasi),
          rateType: '12h',
          driverDays: 0,
          driverFeePerDay: 150000,
        });
        return !hasil.ok && hasil.error === 'RATE_12H_UNAVAILABLE';
      }),
    );
  });

  it('harga travel tidak terpengaruh tanggal maupun durasi', () => {
    fc.assert(
      fc.property(fc.option(rupiah, { nil: null }), (harga) => {
        return calculateTravelPrice(harga) === harga;
      }),
    );
  });
});
```

- [ ] **Step 6: Jalankan property test**

Run: `npm test -- tests/properties/pricing.properties.test.ts`
Expected: PASS, 6 properti

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: fungsi harga sewa dan travel dengan property-based test"
```

---

### Task 4: Fondasi multibahasa

Empat bahasa: `id` (bawaan, tanpa awalan URL), `en`, `zh`, `ko`. Tugas ini membangun tipe, kamus, dan fungsi jatuh-balik yang dipakai seluruh tugas berikutnya. Tidak ada komponen React di sini — semuanya fungsi murni yang bisa diuji tanpa merender apa pun.

**Files:**
- Create: `src/i18n/config.ts`, `src/i18n/locale-path.ts`, `src/i18n/localized.ts`, `src/i18n/messages/id.ts`, `src/i18n/messages/en.ts`, `src/i18n/messages/zh.ts`, `src/i18n/messages/ko.ts`, `src/i18n/index.ts`
- Modify: `src/lib/dates.ts` (format tanggal per bahasa)
- Test: `tests/unit/i18n.test.ts`, `tests/unit/localized.test.ts`

**Interfaces:**
- Consumes: `formatTanggalID` dari `@/lib/dates` (diganti)
- Produces:
  - `type Locale = 'id' | 'en' | 'zh' | 'ko'`, `LOCALES: readonly Locale[]`, `DEFAULT_LOCALE: 'id'`, `LOCALE_LABELS: Record<Locale, string>` — dari `@/i18n/config`
  - `type Localized<T> = { id: T } & Partial<Record<Locale, T>>` — dari `@/i18n/localized`
  - `pickLocale<T>(value: Localized<T> | null | undefined, locale: Locale): T | null` — dari `@/i18n/localized`
  - `toLocalized<T>(value: T): Localized<T>` — dari `@/i18n/localized`
  - `splitLocalePath(pathname: string): { locale: Locale; rest: string }` — dari `@/i18n/locale-path`
  - `localeHref(path: string, locale: Locale): string` — dari `@/i18n/locale-path`
  - `getMessages(locale: Locale): Messages`, `type Messages` — dari `@/i18n`
  - `formatTanggal(d: Date, locale: Locale): string` — dari `@/lib/dates` (menggantikan `formatTanggalID`)

- [ ] **Step 1: Tulis tes pembacaan bahasa dari path yang gagal**

Create `tests/unit/i18n.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { splitLocalePath, localeHref } from '@/i18n/locale-path';
import { LOCALES, DEFAULT_LOCALE } from '@/i18n/config';
import { getMessages } from '@/i18n';

describe('splitLocalePath', () => {
  it('membaca path tanpa awalan sebagai bahasa Indonesia', () => {
    expect(splitLocalePath('/mobil')).toEqual({ locale: 'id', rest: '/mobil' });
  });

  it('membaca awalan /en', () => {
    expect(splitLocalePath('/en/mobil')).toEqual({ locale: 'en', rest: '/mobil' });
  });

  it('membaca awalan /zh dan /ko', () => {
    expect(splitLocalePath('/zh/travel')).toEqual({ locale: 'zh', rest: '/travel' });
    expect(splitLocalePath('/ko/booking')).toEqual({ locale: 'ko', rest: '/booking' });
  });

  it('mengembalikan / untuk awalan bahasa tanpa sisa path', () => {
    expect(splitLocalePath('/en')).toEqual({ locale: 'en', rest: '/' });
    expect(splitLocalePath('/en/')).toEqual({ locale: 'en', rest: '/' });
  });

  it('memperlakukan segmen yang mirip bahasa tapi bukan sebagai path biasa', () => {
    expect(splitLocalePath('/id/mobil')).toEqual({ locale: 'id', rest: '/id/mobil' });
    expect(splitLocalePath('/enak')).toEqual({ locale: 'id', rest: '/enak' });
  });

  it('memperlakukan akar sebagai Indonesia', () => {
    expect(splitLocalePath('/')).toEqual({ locale: 'id', rest: '/' });
  });
});

describe('localeHref', () => {
  it('tidak memberi awalan pada bahasa bawaan', () => {
    expect(localeHref('/mobil', 'id')).toBe('/mobil');
    expect(localeHref('/', 'id')).toBe('/');
  });

  it('memberi awalan pada bahasa lain', () => {
    expect(localeHref('/mobil', 'en')).toBe('/en/mobil');
    expect(localeHref('/', 'ko')).toBe('/ko');
  });

  it('bolak-balik dengan splitLocalePath tanpa berubah', () => {
    for (const locale of LOCALES) {
      for (const path of ['/', '/mobil', '/mobil/innova-zenix-g', '/travel']) {
        expect(splitLocalePath(localeHref(path, locale))).toEqual({ locale, rest: path });
      }
    }
  });
});

describe('kamus pesan', () => {
  it('menyediakan kamus untuk setiap bahasa', () => {
    for (const locale of LOCALES) {
      expect(getMessages(locale).nav.vehicles).toBeTruthy();
    }
  });

  it('setiap bahasa punya kunci yang sama persis dengan bahasa bawaan', () => {
    const kunciBawaan = Object.keys(getMessages(DEFAULT_LOCALE)).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(getMessages(locale)).sort()).toEqual(kunciBawaan);
    }
  });

  it('menerjemahkan label navigasi ke bahasa masing-masing', () => {
    expect(getMessages('id').nav.vehicles).toBe('Kendaraan');
    expect(getMessages('en').nav.vehicles).toBe('Vehicles');
    expect(getMessages('zh').nav.vehicles).toBe('车辆');
    expect(getMessages('ko').nav.vehicles).toBe('차량');
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/i18n.test.ts`
Expected: FAIL — `Failed to resolve import "@/i18n/locale-path"`

- [ ] **Step 3: Implementasi konfigurasi bahasa dan path**

Create `src/i18n/config.ts`:

```ts
export const LOCALES = ['id', 'en', 'zh', 'ko'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'id';

/** Ditulis dalam bahasa masing-masing — orang mencari bahasanya sendiri, bukan namanya dalam bahasa kita. */
export const LOCALE_LABELS: Record<Locale, string> = {
  id: 'Indonesia',
  en: 'English',
  zh: '中文',
  ko: '한국어',
};

/** Kode untuk atribut html lang dan hreflang. */
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en',
  zh: 'zh-CN',
  ko: 'ko-KR',
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
```

Create `src/i18n/locale-path.ts`:

```ts
import { DEFAULT_LOCALE, isLocale, type Locale } from './config';

/**
 * Memisahkan awalan bahasa dari path.
 * Bahasa bawaan tidak memakai awalan, jadi "/id/mobil" adalah path biasa —
 * bukan bahasa Indonesia yang diberi awalan.
 */
export function splitLocalePath(pathname: string): { locale: Locale; rest: string } {
  const segmen = pathname.split('/').filter(Boolean);
  const pertama = segmen[0];

  if (pertama && pertama !== DEFAULT_LOCALE && isLocale(pertama)) {
    const sisa = `/${segmen.slice(1).join('/')}`;
    return { locale: pertama, rest: sisa === '/' ? '/' : sisa };
  }

  return { locale: DEFAULT_LOCALE, rest: pathname === '' ? '/' : pathname };
}

/** Kebalikan splitLocalePath: menyusun URL untuk sebuah path dalam bahasa tertentu. */
export function localeHref(path: string, locale: Locale): string {
  if (locale === DEFAULT_LOCALE) return path;
  return path === '/' ? `/${locale}` : `/${locale}${path}`;
}
```

- [ ] **Step 4: Tulis kamus pesan**

Create `src/i18n/messages/id.ts` — sumber kebenaran kunci.

**Jangan pakai `as const` di sini.** Dengan `as const`, setiap nilai menjadi tipe literal (`'Kendaraan'` alih-alih `string`), sehingga `const en: Messages = { … }` ditolak TypeScript karena `'Vehicles'` bukan `'Kendaraan'`. Kamus perlu menyamakan **bentuk kunci**, bukan isi.

```ts
// Sengaja TANPA `as const` — lihat penjelasan di atas.
const id = {
  nav: {
    home: 'Beranda',
    vehicles: 'Kendaraan',
    travel: 'Travel',
    booking: 'Booking',
    testimonials: 'Testimoni',
    about: 'Tentang',
    contact: 'Kontak',
    contactUs: 'Hubungi Kami',
    openMenu: 'Buka menu',
    closeMenu: 'Tutup menu',
    language: 'Bahasa',
  },
  common: {
    perDay24: 'per 24 jam',
    perDay12: 'per 12 jam',
    seats: 'kursi',
    automatic: 'Matic',
    manual: 'Manual',
    luggage: 'koper',
    unavailable: 'Sedang tersewa',
    photoComingSoon: 'Foto menyusul',
    viewAll: 'Lihat semua',
    contactForPrice: 'Hubungi untuk harga',
    bookNow: 'Booking sekarang',
    askWhatsApp: 'Tanya lewat WhatsApp',
    order: 'Pesan',
    tryAgain: 'Coba lagi',
    backHome: 'Kembali ke beranda',
  },
  catalog: {
    title: 'Armada LIANS',
    subtitle:
      'Semua kendaraan terawat dan siap jalan. Tarif sudah termasuk pajak, belum termasuk BBM dan biaya sopir.',
    search: 'Cari kendaraan',
    searchPlaceholder: 'Avanza, Innova…',
    category: 'Kategori',
    allCategories: 'Semua kategori',
    maxPrice: 'Harga maksimum',
    sort: 'Urutkan',
    sortDefault: 'Urutan bawaan',
    sortPriceAsc: 'Harga termurah',
    sortPriceDesc: 'Harga termahal',
    sortNameAsc: 'Nama A–Z',
    apply: 'Terapkan filter',
    showing: 'Menampilkan {n} dari {total} kendaraan',
    empty:
      'Tidak ada kendaraan yang cocok dengan pencarian Anda. Coba ubah filter atau hubungi kami lewat WhatsApp.',
  },
  vehicle: {
    rate24: 'Tarif 24 jam',
    rate12: 'Tarif 12 jam',
    driverFeeNote: 'Biaya sopir {harga} per hari, dihitung hanya untuk hari yang Anda pakai sopir.',
    capacity: 'Kapasitas',
    transmission: 'Transmisi',
    fuel: 'Bahan bakar',
    year: 'Tahun',
    luggageLabel: 'Bagasi',
    features: 'Fasilitas',
    terms: 'Syarat sewa',
    unavailableNote: 'Sedang tersewa — hubungi kami untuk jadwal berikutnya',
  },
  travel: {
    title: 'Antar-Jemput & Travel',
    subtitle:
      'Tarif berlaku sekali jalan dan sudah termasuk sopir serta BBM. Rute yang belum tercantum tarifnya bisa Anda tanyakan langsung lewat WhatsApp.',
    oneWayIncludingDriver: 'sekali jalan, sudah termasuk sopir',
    empty: 'Belum ada rute yang ditampilkan. Hubungi kami untuk menanyakan tujuan Anda.',
  },
  booking: {
    title: 'Booking Kendaraan',
    subtitle:
      'Pesanan Anda langsung tercatat di sistem kami, lalu WhatsApp terbuka berisi ringkasannya. Tim LIANS akan mengonfirmasi ketersediaan.',
    serviceType: 'Jenis layanan',
    selfDrive: 'Lepas kunci',
    withDriver: 'Dengan sopir',
    tourism: 'Bus / Hiace pariwisata',
    travelService: 'Antar-jemput / travel',
    route: 'Rute',
    chooseRoute: 'Pilih rute…',
    vehicle: 'Kendaraan',
    chooseVehicle: 'Pilih kendaraan…',
    startDate: 'Tanggal mulai',
    endDate: 'Tanggal selesai',
    ratePackage: 'Paket tarif',
    driverDays: 'Hari pakai sopir',
    driverDaysHint: 'Boleh lebih sedikit dari durasi sewa. Isi 0 bila tanpa sopir.',
    driverDaysMax: 'Maksimum {n} hari.',
    driverDaysTooMany: 'Hari pakai sopir tidak boleh lebih dari {n} hari sewa.',
    fullName: 'Nama lengkap',
    whatsappNumber: 'Nomor WhatsApp',
    emailOptional: 'Email (opsional)',
    notesOptional: 'Catatan (opsional)',
    notesPlaceholder: 'Lokasi penjemputan, permintaan khusus…',
    submit: 'Kirim pesanan',
    submitting: 'Mengirim…',
    estimate: 'Perkiraan Biaya',
    estimateHint: 'Lengkapi pilihan kendaraan dan tanggal untuk melihat perkiraan harga.',
    rentalLine: 'Sewa {days} hari × {harga}',
    driverLine: 'Sopir {days} hari × {harga}',
    total: 'Total',
    excludesNote: 'Belum termasuk BBM dan tol. Harga final dikonfirmasi lewat WhatsApp.',
    routeFixedPrice: 'Tarif sekali jalan {harga}, sudah termasuk sopir dan BBM.',
    routeNoPrice: 'Rute ini belum bertarif tetap. Kami akan mengirimkan penawaran lewat WhatsApp.',
    successTitle: 'Pesanan Anda tercatat',
    successBody: 'Kode pesanan Anda {kode}. Simpan kode ini untuk memudahkan komunikasi dengan tim kami.',
    continueWhatsApp: 'Lanjutkan ke WhatsApp',
    successFooter:
      'Belum sempat mengirim chat? Tidak apa-apa — pesanan Anda sudah masuk dan tim kami akan menghubungi Anda.',
    seeOtherVehicles: 'Lihat kendaraan lain',
  },
  home: {
    servingArea: 'Melayani Manado & Sulawesi Utara',
    viewFleet: 'Lihat armada',
    ourServices: 'Layanan Kami',
    featuredFleet: 'Armada Pilihan',
    popularRoutes: 'Rute Antar-Jemput',
    whatCustomersSay: 'Kata Pelanggan',
    serviceSelfDrive: 'Lepas Kunci',
    serviceSelfDriveDesc: 'Bawa sendiri, bebas ke mana saja. Tarif 24 jam atau 12 jam.',
    serviceWithDriver: 'Dengan Sopir',
    serviceWithDriverDesc: 'Sopir berpengalaman yang hafal jalanan Manado.',
    serviceTourism: 'Bus & Hiace Pariwisata',
    serviceTourismDesc: 'Rombongan keluarga, kantor, atau wisata sekolah.',
    serviceAirport: 'Antar-Jemput Bandara',
    serviceAirportDesc: 'Tarif tetap sekali jalan ke Sam Ratulangi dan sekitarnya.',
  },
  testimonials: {
    title: 'Testimoni Pelanggan',
    subtitle: 'Apa kata mereka yang sudah menyewa di LIANS.',
    empty: 'Belum ada testimoni yang ditampilkan.',
    ratingLabel: 'Rating {n} dari 5',
  },
  about: {
    title: 'Tentang LIANS',
    fallback:
      'LIANS melayani rental mobil lepas kunci dan dengan sopir, bus serta Hiace pariwisata, dan antar-jemput bandara di Manado dan sekitarnya. Kantor kami berada di {alamat}.',
  },
  contact: {
    title: 'Hubungi Kami',
    address: 'Alamat',
    whatsapp: 'WhatsApp',
    phone: 'Telepon',
    email: 'Email',
    hours: 'Jam Operasional',
    mapTitle: 'Lokasi LIANS di Google Maps',
  },
  footer: {
    tagline: 'Rental mobil, bus pariwisata, dan antar-jemput bandara di Manado dan Sulawesi Utara.',
    navigation: 'Navigasi',
    contactHeading: 'Hubungi',
    hoursHeading: 'Jam Operasional',
    rights: '© {tahun} LIANS. Seluruh hak cipta dilindungi.',
  },
  pricingError: {
    RATE_12H_UNAVAILABLE: 'Kendaraan ini tidak menyediakan paket 12 jam.',
    DRIVER_DAYS_EXCEEDS_DURATION: 'Hari pakai sopir tidak boleh lebih dari durasi sewa.',
    DRIVER_DAYS_NEGATIVE: 'Hari pakai sopir tidak boleh negatif.',
  },
  error: {
    title: 'Terjadi gangguan',
    body: 'Halaman ini sedang tidak bisa dimuat. Silakan coba lagi, atau hubungi kami langsung lewat WhatsApp.',
    notFoundTitle: 'Halaman tidak ditemukan',
    notFoundBody: 'Halaman yang Anda cari tidak ada atau sudah dipindahkan.',
  },
};

export default id;
```

Create `src/i18n/messages/en.ts`, `zh.ts`, dan `ko.ts` dengan **struktur kunci yang persis sama**, masing-masing diawali:

```ts
import type { Messages } from '../index';

const en: Messages = {
  nav: {
    home: 'Home',
    vehicles: 'Vehicles',
    travel: 'Travel',
    booking: 'Booking',
    testimonials: 'Reviews',
    about: 'About',
    contact: 'Contact',
    contactUs: 'Contact Us',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    language: 'Language',
  },
  // …lanjutkan seluruh kunci dari id.ts
};

export default en;
```

Untuk `zh.ts` mulai dengan `nav: { home: '首页', vehicles: '车辆', travel: '接送', booking: '预订', testimonials: '评价', about: '关于我们', contact: '联系我们', … }`, dan untuk `ko.ts` `nav: { home: '홈', vehicles: '차량', travel: '픽업', booking: '예약', testimonials: '후기', about: '소개', contact: '문의', … }`.

Anotasi `: Messages` inilah pengamannya — kunci yang kurang atau salah ketik membuat `npm run build` gagal, bukan tayang setengah jadi.

Placeholder `{n}`, `{harga}`, `{days}`, `{kode}`, `{tahun}`, `{alamat}`, `{total}` harus tetap ada di semua bahasa; hanya teks di sekitarnya yang berubah.

- [ ] **Step 5: Buat titik masuk kamus**

Create `src/i18n/index.ts`:

```ts
import type { Locale } from './config';
import id from './messages/id';
import en from './messages/en';
import zh from './messages/zh';
import ko from './messages/ko';

/** Bahasa Indonesia adalah sumber kebenaran bentuk kamus. */
export type Messages = typeof id;

const KAMUS: Record<Locale, Messages> = { id, en, zh, ko };

export function getMessages(locale: Locale): Messages {
  return KAMUS[locale];
}

/** Mengisi placeholder: t('Menampilkan {n} dari {total}', { n: 3, total: 8 }) */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (cocok, kunci) =>
    kunci in values ? String(values[kunci]) : cocok,
  );
}

export * from './config';
export * from './localized';
export * from './locale-path';
```

- [ ] **Step 6: Jalankan tes bahasa, pastikan lulus**

Run: `npm test -- tests/unit/i18n.test.ts`
Expected: PASS, 12 tes

- [ ] **Step 7: Tulis tes jatuh-balik terjemahan yang gagal**

Create `tests/unit/localized.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { pickLocale, toLocalized } from '@/i18n/localized';

describe('pickLocale', () => {
  const fitur = { id: ['AC Dingin'], en: ['Cold AC'], ko: ['시원한 에어컨'] };

  it('mengambil bahasa yang diminta bila tersedia', () => {
    expect(pickLocale(fitur, 'en')).toEqual(['Cold AC']);
    expect(pickLocale(fitur, 'ko')).toEqual(['시원한 에어컨']);
  });

  it('jatuh ke bahasa Indonesia bila terjemahan belum diisi', () => {
    expect(pickLocale(fitur, 'zh')).toEqual(['AC Dingin']);
  });

  it('jatuh ke bahasa Indonesia bila terjemahan berupa string kosong', () => {
    expect(pickLocale({ id: 'Halo', en: '' }, 'en')).toBe('Halo');
  });

  it('jatuh ke bahasa Indonesia bila terjemahan berupa array kosong', () => {
    expect(pickLocale({ id: ['A'], en: [] }, 'en')).toEqual(['A']);
  });

  it('mengembalikan null untuk nilai yang tidak ada', () => {
    expect(pickLocale(null, 'en')).toBeNull();
    expect(pickLocale(undefined, 'id')).toBeNull();
  });
});

describe('toLocalized', () => {
  it('membungkus nilai tunggal sebagai bahasa Indonesia', () => {
    expect(toLocalized('Halo')).toEqual({ id: 'Halo' });
  });
});
```

- [ ] **Step 8: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/localized.test.ts`
Expected: FAIL — `Failed to resolve import "@/i18n/localized"`

- [ ] **Step 9: Implementasi jatuh-balik**

Create `src/i18n/localized.ts`:

```ts
import { DEFAULT_LOCALE, type Locale } from './config';

/** Bahasa Indonesia wajib ada; sisanya opsional. */
export type Localized<T> = { id: T } & Partial<Record<Locale, T>>;

function kosong(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/**
 * Mengambil nilai untuk sebuah bahasa, jatuh ke bahasa Indonesia
 * bila terjemahannya belum diisi. Halaman tidak pernah bolong hanya
 * karena staf belum sempat menerjemahkan.
 */
export function pickLocale<T>(
  value: Localized<T> | null | undefined,
  locale: Locale,
): T | null {
  if (!value) return null;

  const diminta = value[locale];
  if (!kosong(diminta)) return diminta as T;

  const bawaan = value[DEFAULT_LOCALE];
  return kosong(bawaan) ? null : (bawaan as T);
}

export function toLocalized<T>(value: T): Localized<T> {
  return { [DEFAULT_LOCALE]: value } as Localized<T>;
}
```

- [ ] **Step 10: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/localized.test.ts`
Expected: PASS, 6 tes

- [ ] **Step 11: Ganti format tanggal agar mengikuti bahasa**

Modify `src/lib/dates.ts` — `formatTanggalID` diganti `formatTanggal(d, locale)`:

```ts
import { differenceInCalendarDays, format } from 'date-fns';
import { id as idLocale, enUS, zhCN, ko as koLocale } from 'date-fns/locale';
import type { Locale } from '@/i18n/config';

/**
 * Jumlah hari sewa = selisih hari kalender, minimum 1.
 * 1 Agustus sampai 3 Agustus = 2 hari (dua periode 24 jam).
 */
export function countRentalDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start));
}

const DATE_FNS_LOCALE = { id: idLocale, en: enUS, zh: zhCN, ko: koLocale };
const DATE_PATTERN: Record<Locale, string> = {
  id: 'd MMMM yyyy',
  en: 'd MMMM yyyy',
  zh: 'yyyy年M月d日',
  ko: 'yyyy년 M월 d일',
};

export function formatTanggal(d: Date, locale: Locale): string {
  return format(d, DATE_PATTERN[locale], { locale: DATE_FNS_LOCALE[locale] });
}
```

Perbarui `tests/unit/dates.test.ts` — ganti blok `formatTanggalID`:

```ts
describe('formatTanggal', () => {
  it('memformat dalam bahasa Indonesia', () => {
    expect(formatTanggal(new Date('2026-08-10'), 'id')).toBe('10 Agustus 2026');
  });

  it('memformat dalam bahasa Inggris', () => {
    expect(formatTanggal(new Date('2026-08-10'), 'en')).toBe('10 August 2026');
  });

  it('memakai urutan tahun-bulan-hari untuk Mandarin dan Korea', () => {
    expect(formatTanggal(new Date('2026-08-10'), 'zh')).toBe('2026年8月10日');
    expect(formatTanggal(new Date('2026-08-10'), 'ko')).toBe('2026년 8월 10일');
  });
});
```

Ganti juga impornya di baris atas berkas tes: `import { countRentalDays, formatTanggal } from '@/lib/dates';`

- [ ] **Step 12: Jalankan seluruh tes**

Run: `npm test`
Expected: PASS semua — 3 tes tanggal lama diganti 3 tes baru, tidak ada rujukan tersisa ke `formatTanggalID`

- [ ] **Step 13: Pastikan tidak ada sisa `formatTanggalID`**

Run: `grep -rn "formatTanggalID" src tests || echo "bersih"`
Expected: `bersih`

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "feat: fondasi multibahasa — tipe Locale, kamus, jatuh-balik terjemahan"
```

---

### Task 5: Skema database dan koneksi Neon

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `drizzle.config.ts`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces, dari `@/db/schema`: tabel `vehicles`, `travelRoutes`, `bookings`, `testimonials`, `siteSettings`, `users`; tipe `Vehicle`, `NewVehicle`, `TravelRoute`, `NewTravelRoute`, `Booking`, `NewBooking`, `Testimonial`, `NewTestimonial`, `SiteSetting`, `User`. Dari `@/db`: instance `db`.

- [ ] **Step 1: Siapkan database Neon**

Buka https://console.neon.tech, buat akun gratis, buat proyek bernama `lians`. Salin connection string (yang berakhiran `?sslmode=require`).

Create `.env.local`:

```bash
DATABASE_URL="postgresql://...@....neon.tech/neondb?sslmode=require"
```

- [ ] **Step 2: Tulis skema Drizzle**

Create `src/db/schema.ts`:

```ts
import {
  pgTable, pgEnum, uuid, text, integer, boolean, jsonb, date, timestamp,
} from 'drizzle-orm/pg-core';
import type { Localized } from '@/i18n/localized';

export const vehicleCategoryEnum = pgEnum('vehicle_category', [
  'hatchback', 'sedan', 'suv', 'mpv', 'luxury', 'bus',
]);
export const transmissionEnum = pgEnum('transmission', ['manual', 'automatic']);
export const fuelTypeEnum = pgEnum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['available', 'unavailable']);
export const serviceTypeEnum = pgEnum('service_type', [
  'self-drive', 'with-driver', 'tourism', 'travel',
]);
export const rateTypeEnum = pgEnum('rate_type', ['24h', '12h']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending', 'confirmed', 'cancelled', 'completed',
]);

export type VehicleImage = { url: string; publicId: string; alt: string };

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: vehicleCategoryEnum('category').notNull(),
  images: jsonb('images').$type<VehicleImage[]>().notNull().default([]),
  rate24h: integer('rate_24h').notNull(),
  rate12h: integer('rate_12h'),
  driverFeeOverride: integer('driver_fee_override'),
  serviceTypes: jsonb('service_types').$type<string[]>().notNull().default([]),
  seats: integer('seats').notNull(),
  transmission: transmissionEnum('transmission').notNull(),
  fuelType: fuelTypeEnum('fuel_type').notNull(),
  year: integer('year').notNull(),
  luggage: integer('luggage').notNull().default(0),
  features: jsonb('features').$type<Localized<string[]>>().notNull().default({ id: [] }),
  rentalTerms: jsonb('rental_terms').$type<Localized<string[]>>().notNull().default({ id: [] }),
  status: vehicleStatusEnum('status').notNull().default('available'),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const travelRoutes = pgTable('travel_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  price: integer('price'),
  vehicleNote: jsonb('vehicle_note').$type<Localized<string> | null>(),
  estimatedDuration: jsonb('estimated_duration').$type<Localized<string> | null>(),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PriceBreakdownJson = {
  days: number;
  ratePerDay: number;
  rentalCost: number;
  driverDays: number;
  driverFeePerDay: number;
  driverCost: number;
  total: number;
};

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingCode: text('booking_code').notNull().unique(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  serviceType: serviceTypeEnum('service_type').notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  routeId: uuid('route_id').references(() => travelRoutes.id, { onDelete: 'set null' }),
  vehicleNameSnapshot: text('vehicle_name_snapshot'),
  routeNameSnapshot: text('route_name_snapshot'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  rateType: rateTypeEnum('rate_type'),
  driverDays: integer('driver_days').notNull().default(0),
  totalPrice: integer('total_price'),
  priceBreakdown: jsonb('price_breakdown').$type<PriceBreakdownJson | null>(),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testimonials = pgTable('testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),
  reviewText: jsonb('review_text').$type<Localized<string>>().notNull(),
  vehicleName: text('vehicle_name'),
  date: date('date').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type TravelRoute = typeof travelRoutes.$inferSelect;
export type NewTravelRoute = typeof travelRoutes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type User = typeof users.$inferSelect;
```

- [ ] **Step 3: Buat koneksi database**

Create `src/db/index.ts`:

```ts
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL belum diatur. Salin .env.example ke .env.local dan isi.');
}

export const db = drizzle(neon(connectionString), { schema });
export * from './schema';
```

- [ ] **Step 4: Konfigurasi drizzle-kit**

Create `drizzle.config.ts`:

```ts
import { defineConfig } from 'drizzle-kit';
import 'dotenv/config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 5: Tulis tes yang mengunci bentuk skema**

Create `tests/unit/schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { vehicles, bookings, travelRoutes } from '@/db/schema';

const kolom = (t: Parameters<typeof getTableConfig>[0]) =>
  Object.fromEntries(getTableConfig(t).columns.map((c) => [c.name, c]));

describe('skema vehicles', () => {
  it('rate_24h wajib, rate_12h boleh kosong', () => {
    const c = kolom(vehicles);
    expect(c['rate_24h'].notNull).toBe(true);
    expect(c['rate_12h'].notNull).toBe(false);
  });

  it('memisahkan status dari is_published', () => {
    const c = kolom(vehicles);
    expect(c['status']).toBeDefined();
    expect(c['is_published']).toBeDefined();
  });
});

describe('skema bookings', () => {
  it('end_date, rate_type, dan total_price boleh kosong untuk pesanan travel', () => {
    const c = kolom(bookings);
    expect(c['end_date'].notNull).toBe(false);
    expect(c['rate_type'].notNull).toBe(false);
    expect(c['total_price'].notNull).toBe(false);
  });

  it('start_date dan booking_code wajib', () => {
    const c = kolom(bookings);
    expect(c['start_date'].notNull).toBe(true);
    expect(c['booking_code'].notNull).toBe(true);
  });
});

describe('skema travel_routes', () => {
  it('price boleh kosong agar rute bisa ditambah sebelum bertarif', () => {
    expect(kolom(travelRoutes)['price'].notNull).toBe(false);
  });
});

describe('kolom yang dapat diterjemahkan', () => {
  it('features dan rental_terms disimpan sebagai jsonb, bukan array datar', () => {
    const c = kolom(vehicles);
    expect(c['features'].dataType).toBe('json');
    expect(c['rental_terms'].dataType).toBe('json');
  });

  it('nilai bawaan features memuat kunci bahasa Indonesia', () => {
    expect(kolom(vehicles)['features'].default).toEqual({ id: [] });
  });

  it('catatan kendaraan dan waktu tempuh rute disimpan sebagai jsonb', () => {
    const c = kolom(travelRoutes);
    expect(c['vehicle_note'].dataType).toBe('json');
    expect(c['estimated_duration'].dataType).toBe('json');
  });
});
```

- [ ] **Step 6: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/schema.test.ts`
Expected: PASS, 5 tes

- [ ] **Step 7: Buat dan jalankan migrasi**

```bash
npm run db:generate
npm run db:migrate
```

Expected: folder `drizzle/` berisi berkas SQL, dan migrasi diterapkan ke Neon tanpa error.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: skema database Drizzle dan koneksi Neon"
```

---

### Task 6: Skema Zod bersama dan tipe ActionResult

**Files:**
- Create: `src/actions/result.ts`, `src/schemas/booking.ts`, `src/schemas/vehicle.ts`, `src/schemas/route.ts`, `src/schemas/testimonial.ts`, `src/schemas/settings.ts`
- Test: `tests/unit/schemas.test.ts`

**Interfaces:**
- Consumes: tidak ada
- Produces:
  - `type ActionResult<T>` dari `@/actions/result`, plus `ok<T>(data: T)` dan `fail(message: string, fieldErrors?: Record<string, string[]>)`
  - `bookingInputSchema`, `type BookingInput` dari `@/schemas/booking`
  - `vehicleInputSchema`, `type VehicleInput` dari `@/schemas/vehicle`
  - `routeInputSchema`, `type RouteInput` dari `@/schemas/route`
  - `testimonialInputSchema`, `type TestimonialInput` dari `@/schemas/testimonial`
  - `settingsInputSchema`, `type SettingsInput` dari `@/schemas/settings`

- [ ] **Step 1: Buat tipe ActionResult**

Create `src/actions/result.ts`:

```ts
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail<T>(
  message: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<T> {
  return { ok: false, message, fieldErrors };
}
```

- [ ] **Step 2: Tulis tes skema booking yang gagal**

Create `tests/unit/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { bookingInputSchema } from '@/schemas/booking';

const sewaValid = {
  customerName: 'Budi Santoso',
  phone: '081234567890',
  email: 'budi@example.com',
  serviceType: 'with-driver' as const,
  vehicleId: '11111111-1111-4111-8111-111111111111',
  startDate: '2099-08-01',
  endDate: '2099-08-06',
  rateType: '24h' as const,
  driverDays: 3,
  notes: '',
};

const travelValid = {
  customerName: 'Sari',
  phone: '+6281234567890',
  serviceType: 'travel' as const,
  routeId: '22222222-2222-4222-8222-222222222222',
  startDate: '2099-08-01',
  driverDays: 0,
};

describe('bookingInputSchema — sewa kendaraan', () => {
  it('menerima pesanan sewa yang lengkap', () => {
    expect(bookingInputSchema.safeParse(sewaValid).success).toBe(true);
  });

  it('menolak hari sopir melebihi durasi', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, driverDays: 9 });
    expect(r.success).toBe(false);
  });

  it('menolak tanggal selesai sebelum tanggal mulai', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, endDate: '2099-07-30' });
    expect(r.success).toBe(false);
  });

  it('menolak tanggal mulai di masa lalu', () => {
    const r = bookingInputSchema.safeParse({
      ...sewaValid,
      startDate: '2020-01-01',
      endDate: '2020-01-03',
    });
    expect(r.success).toBe(false);
  });

  it('menolak sewa tanpa vehicleId', () => {
    const { vehicleId: _abaikan, ...tanpaMobil } = sewaValid;
    expect(bookingInputSchema.safeParse(tanpaMobil).success).toBe(false);
  });

  it('menolak nomor telepon bukan format Indonesia', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, phone: '12345' });
    expect(r.success).toBe(false);
  });

  it('menerima email kosong karena email opsional', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, email: '' });
    expect(r.success).toBe(true);
  });
});

describe('bookingInputSchema — travel', () => {
  it('menerima pesanan travel tanpa endDate dan rateType', () => {
    expect(bookingInputSchema.safeParse(travelValid).success).toBe(true);
  });

  it('menolak pesanan travel yang membawa rateType', () => {
    const r = bookingInputSchema.safeParse({ ...travelValid, rateType: '24h' });
    expect(r.success).toBe(false);
  });

  it('menolak pesanan travel dengan hari sopir lebih dari nol', () => {
    const r = bookingInputSchema.safeParse({ ...travelValid, driverDays: 2 });
    expect(r.success).toBe(false);
  });

  it('menolak pesanan travel tanpa routeId', () => {
    const { routeId: _abaikan, ...tanpaRute } = travelValid;
    expect(bookingInputSchema.safeParse(tanpaRute).success).toBe(false);
  });
});
```

- [ ] **Step 3: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: FAIL — `Failed to resolve import "@/schemas/booking"`

- [ ] **Step 4: Implementasi skema booking**

Create `src/schemas/booking.ts`:

```ts
import { z } from 'zod';
import { differenceInCalendarDays, startOfDay } from 'date-fns';

const teleponID = z
  .string()
  .trim()
  .regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor telepon tidak valid. Contoh: 081234567890');

const tanggal = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid');

const dasar = {
  customerName: z.string().trim().min(2, 'Nama minimal 2 karakter').max(100),
  phone: teleponID,
  email: z.union([z.literal(''), z.string().email('Format email tidak valid')]).optional(),
  notes: z.string().max(1000).optional(),
  startDate: tanggal,
};

const sewaKendaraan = z.object({
  ...dasar,
  serviceType: z.enum(['self-drive', 'with-driver', 'tourism']),
  vehicleId: z.string().uuid('Kendaraan wajib dipilih'),
  routeId: z.undefined().optional(),
  endDate: tanggal,
  rateType: z.enum(['24h', '12h']),
  driverDays: z.number().int().min(0),
});

const travel = z.object({
  ...dasar,
  serviceType: z.literal('travel'),
  routeId: z.string().uuid('Rute wajib dipilih'),
  vehicleId: z.undefined().optional(),
  endDate: z.undefined().optional(),
  rateType: z.undefined().optional(),
  driverDays: z.literal(0).optional().default(0),
});

export const bookingInputSchema = z
  .discriminatedUnion('serviceType', [sewaKendaraan, travel])
  .superRefine((data, ctx) => {
    const mulai = startOfDay(new Date(data.startDate));

    if (mulai < startOfDay(new Date())) {
      ctx.addIssue({
        code: 'custom',
        path: ['startDate'],
        message: 'Tanggal mulai tidak boleh di masa lalu',
      });
    }

    if (data.serviceType === 'travel') return;

    const selesai = startOfDay(new Date(data.endDate));
    if (selesai < mulai) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Tanggal selesai harus setelah tanggal mulai',
      });
      return;
    }

    const jumlahHari = Math.max(1, differenceInCalendarDays(selesai, mulai));
    if (data.driverDays > jumlahHari) {
      ctx.addIssue({
        code: 'custom',
        path: ['driverDays'],
        message: `Hari pakai sopir tidak boleh lebih dari ${jumlahHari} hari sewa`,
      });
    }
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;
```

Catatan: aturan "paket 12 jam ditolak bila kendaraan tidak punya `rate12h`" tidak bisa ditegakkan di sini karena skema tidak melihat data kendaraan. Aturan itu ditegakkan di `calculateRentalPrice` (Task 3) dan diperiksa lagi di Server Action (Task 12).

- [ ] **Step 5: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: PASS, 11 tes

- [ ] **Step 6: Buat validator terjemahan**

Create `src/schemas/localized.ts`:

```ts
import { z } from 'zod';

/**
 * Bahasa Indonesia wajib, tiga lainnya opsional.
 *
 * Ditulis eksplisit per bahasa, bukan dibangkitkan dari daftar LOCALES.
 * Versi dinamis memaksa cast ke `Record<string, ZodTypeAny>` yang membuang
 * seluruh tipe hasilnya — justru menghilangkan alasan memakai Zod.
 * Konsekuensinya: menambah bahasa kelima kelak perlu menyentuh berkas ini.
 */
export function localizedString(inner: z.ZodString) {
  const opsional = inner.or(z.literal('')).optional();
  return z.object({ id: inner, en: opsional, zh: opsional, ko: opsional });
}

export function localizedArray(inner: z.ZodString) {
  const daftar = z.array(inner);
  return z.object({
    // Wajib ada, tetapi boleh berupa daftar kosong. JANGAN pakai `.default([])`:
    // default membuat kunci ini opsional, sehingga kendaraan yang fasilitasnya
    // hanya diisi dalam bahasa Inggris tampil kosong bagi pengunjung Indonesia —
    // pasar utamanya justru yang dirugikan.
    id: daftar,
    en: daftar.optional(),
    zh: daftar.optional(),
    ko: daftar.optional(),
  });
}
```

**Catatan Zod 4.** Proyek memakai Zod 4.4.x. Di dalam `superRefine`, kode isu ditulis sebagai literal `'custom'` (`ctx.addIssue({ code: 'custom', … })`), bukan `z.ZodIssueCode.custom` seperti pada Zod 3.

- [ ] **Step 7: Implementasi skema admin**

Create `src/schemas/vehicle.ts`:

```ts
import { z } from 'zod';
import { localizedArray } from './localized';

export const vehicleInputSchema = z
  .object({
    name: z.string().trim().min(2, 'Nama kendaraan wajib diisi').max(100),
    slug: z.string().trim().optional(),
    category: z.enum(['hatchback', 'sedan', 'suv', 'mpv', 'luxury', 'bus']),
    images: z
      .array(z.object({ url: z.string().url(), publicId: z.string(), alt: z.string() }))
      .default([]),
    rate24h: z.coerce.number().int().min(0, 'Tarif 24 jam wajib diisi'),
    rate12h: z.coerce.number().int().min(0).nullable().default(null),
    serviceTypes: z
      .array(z.enum(['self-drive', 'with-driver', 'tourism']))
      .min(1, 'Pilih minimal satu jenis layanan'),
    seats: z.coerce.number().int().min(1).max(60),
    transmission: z.enum(['manual', 'automatic']),
    fuelType: z.enum(['petrol', 'diesel', 'electric', 'hybrid']),
    year: z.coerce.number().int().min(1990).max(new Date().getFullYear() + 1),
    luggage: z.coerce.number().int().min(0).default(0),
    features: localizedArray(z.string().trim().min(1)),
    rentalTerms: localizedArray(z.string().trim().min(1)),
    status: z.enum(['available', 'unavailable']).default('available'),
    isPublished: z.boolean().default(true),
    sortOrder: z.coerce.number().int().default(0),
  })
  .refine((v) => v.rate12h === null || v.rate12h <= v.rate24h, {
    path: ['rate12h'],
    message: 'Tarif 12 jam seharusnya tidak lebih mahal dari tarif 24 jam',
  });

export type VehicleInput = z.infer<typeof vehicleInputSchema>;
```

Create `src/schemas/route.ts`:

```ts
import { z } from 'zod';
import { localizedString } from './localized';

export const routeInputSchema = z.object({
  origin: z.string().trim().min(2, 'Asal wajib diisi').max(100),
  destination: z.string().trim().min(2, 'Tujuan wajib diisi').max(100),
  price: z.coerce.number().int().min(0).nullable().default(null),
  vehicleNote: localizedString(z.string().trim().max(100)).nullable().default(null),
  estimatedDuration: localizedString(z.string().trim().max(50)).nullable().default(null),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type RouteInput = z.infer<typeof routeInputSchema>;
```

Create `src/schemas/testimonial.ts`:

```ts
import { z } from 'zod';
import { localizedString } from './localized';

export const testimonialInputSchema = z.object({
  customerName: z.string().trim().min(2, 'Nama wajib diisi').max(100),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: localizedString(z.string().trim().min(10, 'Ulasan minimal 10 karakter').max(500)),
  vehicleName: z.string().trim().max(100).nullable().default(null),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  isFeatured: z.boolean().default(false),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type TestimonialInput = z.infer<typeof testimonialInputSchema>;
```

Create `src/schemas/settings.ts`:

```ts
import { z } from 'zod';
import { localizedString } from './localized';

export const settingsInputSchema = z.object({
  whatsappNumber: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor WhatsApp tidak valid'),
  phone: z.string().trim().max(30),
  email: z.union([z.literal(''), z.string().email()]),
  address: z.string().trim().min(5),
  mapsUrl: z.union([z.literal(''), z.string().url()]),
  operatingHours: localizedString(z.string().trim().max(200)),
  heroTitle: localizedString(z.string().trim().max(120)),
  heroSubtitle: localizedString(z.string().trim().max(300)),
  aboutText: localizedString(z.string().trim().max(4000)),
  socialLinks: z
    .array(z.object({ label: z.string().trim().min(1), url: z.string().url() }))
    .default([]),
  promoBanner: localizedString(z.string().trim().max(200)),
  driverFeePerDay: z.coerce.number().int().min(0),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
```

- [ ] **Step 8: Jalankan seluruh tes**

Run: `npm test`
Expected: PASS semua

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: skema Zod bersama, validator terjemahan, dan tipe ActionResult"
```

---

### Task 7: Lapisan query dan data awal

**Files:**
- Create: `src/queries/vehicles.ts`, `src/queries/routes.ts`, `src/queries/testimonials.ts`, `src/queries/settings.ts`, `src/queries/bookings.ts`, `src/db/seed.ts`
- Test: `tests/integration/queries.test.ts`

**Interfaces:**
- Consumes: `db` dari `@/db`, tabel dari `@/db/schema`
- Produces:
  - `@/queries/vehicles`: `getPublishedVehicles()`, `getVehicleBySlug(slug)`, `getFeaturedVehicles(limit)`, `getAllVehicles()`, `getVehicleById(id)`
  - `@/queries/routes`: `getPublishedRoutes()`, `getAllRoutes()`, `getRouteById(id)`
  - `@/queries/testimonials`: `getPublishedTestimonials()`, `getFeaturedTestimonials(limit)`, `getAllTestimonials()`
  - `@/queries/settings`: `getSettings(): Promise<SettingsInput>` — selalu mengembalikan objek lengkap dengan nilai bawaan
  - `@/queries/bookings`: `getBookings(status?)`, `getBookingById(id)`, `getPendingCount()`

- [ ] **Step 1: Implementasi query kendaraan**

Create `src/queries/vehicles.ts`:

```ts
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles } from '@/db/schema';

export async function getPublishedVehicles() {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isPublished, true))
    .orderBy(asc(vehicles.sortOrder), asc(vehicles.name));
}

export async function getVehicleBySlug(slug: string) {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.slug, slug)).limit(1);
  return row ?? null;
}

export async function getVehicleById(id: string) {
  const [row] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return row ?? null;
}

export async function getFeaturedVehicles(limit = 6) {
  return db
    .select()
    .from(vehicles)
    .where(eq(vehicles.isPublished, true))
    .orderBy(asc(vehicles.sortOrder))
    .limit(limit);
}

export async function getAllVehicles() {
  return db.select().from(vehicles).orderBy(asc(vehicles.sortOrder), asc(vehicles.name));
}
```

- [ ] **Step 2: Implementasi query rute, testimoni, dan booking**

Create `src/queries/routes.ts`:

```ts
import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { travelRoutes } from '@/db/schema';

export async function getPublishedRoutes() {
  return db
    .select()
    .from(travelRoutes)
    .where(eq(travelRoutes.isPublished, true))
    .orderBy(asc(travelRoutes.sortOrder), asc(travelRoutes.destination));
}

export async function getAllRoutes() {
  return db.select().from(travelRoutes).orderBy(asc(travelRoutes.sortOrder));
}

export async function getRouteById(id: string) {
  const [row] = await db.select().from(travelRoutes).where(eq(travelRoutes.id, id)).limit(1);
  return row ?? null;
}
```

Create `src/queries/testimonials.ts`:

```ts
import { and, asc, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { testimonials } from '@/db/schema';

export async function getPublishedTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true))
    .orderBy(asc(testimonials.sortOrder), desc(testimonials.date));
}

export async function getFeaturedTestimonials(limit = 5) {
  return db
    .select()
    .from(testimonials)
    .where(and(eq(testimonials.isPublished, true), eq(testimonials.isFeatured, true)))
    .orderBy(asc(testimonials.sortOrder))
    .limit(limit);
}

export async function getAllTestimonials() {
  return db.select().from(testimonials).orderBy(asc(testimonials.sortOrder));
}
```

Create `src/queries/bookings.ts`:

```ts
import { count, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { bookings } from '@/db/schema';

type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export async function getBookings(status?: Status) {
  // Drizzle tidak mengizinkan .where() setelah .orderBy(), jadi cabangnya di sini.
  return status
    ? db.select().from(bookings).where(eq(bookings.status, status)).orderBy(desc(bookings.createdAt))
    : db.select().from(bookings).orderBy(desc(bookings.createdAt));
}

export async function getBookingById(id: string) {
  const [row] = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
  return row ?? null;
}

export async function getPendingCount() {
  const [row] = await db
    .select({ jumlah: count() })
    .from(bookings)
    .where(eq(bookings.status, 'pending'));
  return row?.jumlah ?? 0;
}
```

- [ ] **Step 3: Implementasi query pengaturan dengan nilai bawaan**

Create `src/queries/settings.ts`:

```ts
import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import type { SettingsInput } from '@/schemas/settings';

export const DEFAULT_SETTINGS: SettingsInput = {
  whatsappNumber: '081234567890',
  phone: '081234567890',
  email: 'info@lians.id',
  address: 'Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125',
  mapsUrl: '',
  socialLinks: [],
  driverFeePerDay: 150000,

  // Lima kunci berikut dapat diterjemahkan; Indonesia wajib, sisanya opsional.
  operatingHours: {
    id: 'Setiap hari, 07.00 – 21.00 WITA',
    en: 'Daily, 7:00 AM – 9:00 PM (WITA)',
    zh: '每天 07:00 – 21:00（WITA）',
    ko: '매일 07:00 – 21:00 (WITA)',
  },
  heroTitle: {
    id: 'Rental Mobil Terpercaya di Manado',
    en: 'Trusted Car Rental in Manado',
    zh: '万鸦老值得信赖的租车服务',
    ko: '마나도의 믿을 수 있는 렌터카',
  },
  heroSubtitle: {
    id: 'Lepas kunci, dengan sopir, bus pariwisata, dan antar-jemput bandara. Armada terawat, harga jelas.',
    en: 'Self-drive, with driver, tour buses, and airport transfers. Well-maintained fleet, transparent pricing.',
    zh: '自驾、含司机、旅游巴士与机场接送。车况良好，价格透明。',
    ko: '자차 운전, 기사 포함, 관광버스, 공항 픽업. 잘 관리된 차량과 투명한 요금.',
  },
  aboutText: { id: '' },
  promoBanner: { id: '' },
};

/**
 * Selalu mengembalikan objek lengkap. Kunci yang belum pernah disimpan
 * jatuh ke nilai bawaan, sehingga halaman tidak pernah menampilkan bagian kosong
 * hanya karena admin belum sempat mengisinya.
 */
export async function getSettings(): Promise<SettingsInput> {
  const rows = await db.select().from(siteSettings);
  const tersimpan = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...tersimpan } as SettingsInput;
}
```

- [ ] **Step 4: Tulis skrip seed**

Create `src/db/seed.ts`:

Env dimuat lewat flag pada perintah, bukan di dalam berkas: impor ES di-hoist ke atas panggilan apa pun, sehingga memanggil `dotenv` di dalam `seed.ts` sudah terlambat — `src/db/index.ts` keburu dievaluasi dan melempar "DATABASE_URL belum diatur".

Ubah skripnya di `package.json`:

```json
"db:seed": "tsx --env-file=.env.local src/db/seed.ts"
```

```ts
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { siteSettings, testimonials, travelRoutes, users, vehicles } from '@/db/schema';
import { DEFAULT_SETTINGS } from '@/queries/settings';
import { slugify } from '@/lib/slug';

const armada = [
  { name: 'All New Brio', category: 'hatchback' as const, rate24h: 350000, rate12h: 250000, seats: 5, transmission: 'automatic' as const, year: 2024 },
  { name: 'Toyota Avanza', category: 'mpv' as const, rate24h: 400000, rate12h: 300000, seats: 7, transmission: 'manual' as const, year: 2023 },
  { name: 'Toyota Rush', category: 'suv' as const, rate24h: 500000, rate12h: 375000, seats: 7, transmission: 'automatic' as const, year: 2023 },
  { name: 'Innova Reborn', category: 'mpv' as const, rate24h: 700000, rate12h: 500000, seats: 7, transmission: 'automatic' as const, year: 2022 },
  { name: 'Innova Zenix G', category: 'mpv' as const, rate24h: 900000, rate12h: 650000, seats: 7, transmission: 'automatic' as const, year: 2024 },
  { name: 'Toyota Fortuner', category: 'suv' as const, rate24h: 1200000, rate12h: 850000, seats: 7, transmission: 'automatic' as const, year: 2023 },
  { name: 'Toyota Alphard', category: 'luxury' as const, rate24h: 2500000, rate12h: null, seats: 7, transmission: 'automatic' as const, year: 2022 },
  { name: 'Hiace Commuter', category: 'bus' as const, rate24h: 1300000, rate12h: 950000, seats: 15, transmission: 'manual' as const, year: 2023 },
];

const durasi = (id: string, en: string, zh: string, ko: string) => ({ id, en, zh, ko });

const rute = [
  { origin: 'Manado', destination: 'Bandara Sam Ratulangi', price: 150000, estimatedDuration: durasi('30 menit', '30 minutes', '30 分钟', '30분') },
  { origin: 'Manado', destination: 'Tomohon', price: 300000, estimatedDuration: durasi('1 jam', '1 hour', '1 小时', '1시간') },
  { origin: 'Manado', destination: 'Bitung', price: 400000, estimatedDuration: durasi('1,5 jam', '1.5 hours', '1.5 小时', '1시간 30분') },
  { origin: 'Manado', destination: 'Likupang', price: null, estimatedDuration: durasi('2 jam', '2 hours', '2 小时', '2시간') },
];

async function seed() {
  console.log('Mengisi data awal…');

  await db.insert(vehicles).values(
    armada.map((m, i) => ({
      ...m,
      slug: slugify(m.name),
      images: [],
      driverFeeOverride: null,
      serviceTypes: m.category === 'bus' ? ['with-driver', 'tourism'] : ['self-drive', 'with-driver'],
      fuelType: 'petrol' as const,
      luggage: 2,
      features: {
        id: ['AC Dingin', 'Audio', 'Terawat'],
        en: ['Cold AC', 'Audio system', 'Well maintained'],
        zh: ['冷气充足', '音响系统', '车况良好'],
        ko: ['시원한 에어컨', '오디오', '잘 관리됨'],
      },
      rentalTerms:
        m.category === 'bus'
          ? {
              id: ['Include driver', 'Durasi 12 jam', 'Area Manado dan sekitarnya'],
              en: ['Driver included', '12-hour package', 'Manado area and surroundings'],
              zh: ['含司机', '12 小时套餐', '万鸦老及周边地区'],
              ko: ['기사 포함', '12시간 패키지', '마나도 및 인근 지역'],
            }
          : {
              id: ['Lepas kunci', 'Durasi 24 jam', 'Jaminan KTP + KK'],
              en: ['Self-drive', '24-hour package', 'ID card + family card as deposit'],
              zh: ['自驾', '24 小时套餐', '需押身份证与家庭卡'],
              ko: ['자차 운전', '24시간 패키지', '신분증 + 가족관계증명서 보증'],
            },
      status: 'available' as const,
      isPublished: true,
      sortOrder: i,
    })),
  );

  await db.insert(travelRoutes).values(
    rute.map((r, i) => ({
      ...r,
      vehicleNote: { id: 'Avanza / Xenia', en: 'Avanza / Xenia', zh: 'Avanza / Xenia', ko: 'Avanza / Xenia' },
      isPublished: true,
      sortOrder: i,
    })),
  );

  await db.insert(testimonials).values([
    {
      customerName: 'Rina M.',
      rating: 5,
      reviewText: {
        id: 'Mobil bersih dan tepat waktu. Sopirnya ramah, tahu jalan tikus Manado.',
        en: 'Clean car and right on time. Friendly driver who knows every shortcut in Manado.',
        zh: '车子干净，准时到达。司机友善，熟悉万鸦老的每条近路。',
        ko: '차가 깨끗하고 시간을 잘 지켰습니다. 기사님이 친절하고 마나도 길을 훤히 아세요.',
      },
      vehicleName: 'Innova Reborn', date: '2026-06-12', isFeatured: true, isPublished: true, sortOrder: 0,
    },
    {
      customerName: 'Dedi K.',
      rating: 5,
      reviewText: {
        id: 'Proses cepat, harga sesuai yang disebut di awal. Tidak ada biaya tersembunyi.',
        en: 'Fast process, price exactly as quoted. No hidden fees.',
        zh: '流程快捷，价格与最初报价一致，没有隐藏费用。',
        ko: '절차가 빠르고 처음 안내받은 금액 그대로였습니다. 숨은 비용이 없어요.',
      },
      vehicleName: 'Toyota Avanza', date: '2026-07-02', isFeatured: true, isPublished: true, sortOrder: 1,
    },
    {
      customerName: 'Grace L.',
      rating: 4,
      reviewText: {
        id: 'Hiace-nya nyaman untuk rombongan keluarga ke Tomohon. Rekomendasi.',
        en: 'The Hiace was comfortable for our family trip to Tomohon. Recommended.',
        zh: 'Hiace 很适合我们全家去托莫洪的行程，推荐。',
        ko: '가족 단위로 토모혼 갈 때 하이에스가 편안했습니다. 추천합니다.',
      },
      vehicleName: 'Hiace Commuter', date: '2026-07-20', isFeatured: true, isPublished: true, sortOrder: 2,
    },
  ]);

  await db.insert(siteSettings).values(
    Object.entries(DEFAULT_SETTINGS).map(([key, value]) => ({ key, value: value as never })),
  );

  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@lians.id';
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!password) {
    throw new Error('Atur SEED_ADMIN_PASSWORD di .env.local sebelum menjalankan seed.');
  }

  await db.insert(users).values({
    email,
    name: 'Admin LIANS',
    passwordHash: await bcrypt.hash(password, 12),
  });

  console.log(`Selesai. Akun admin: ${email}`);
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 5: Jalankan seed**

Tambahkan ke `.env.local`:

```bash
SEED_ADMIN_EMAIL="admin@lians.id"
SEED_ADMIN_PASSWORD="ganti-dengan-password-kuat"
```

Run: `npm run db:seed`
Expected: `Selesai. Akun admin: admin@lians.id`

- [ ] **Step 6: Tulis tes integrasi query**

Create `tests/integration/queries.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getPublishedVehicles, getVehicleBySlug } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';

// Tes ini menyentuh database sungguhan. Lewati bila DATABASE_URL tidak diatur.
const jalankan = process.env.DATABASE_URL ? describe : describe.skip;

jalankan('query terhadap data seed', () => {
  it('mengembalikan kendaraan yang dipublikasikan', async () => {
    const hasil = await getPublishedVehicles();
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil.every((v) => v.isPublished)).toBe(true);
  });

  it('menemukan kendaraan berdasarkan slug', async () => {
    const v = await getVehicleBySlug('innova-zenix-g');
    expect(v?.name).toBe('Innova Zenix G');
  });

  it('mengembalikan null untuk slug yang tidak ada', async () => {
    expect(await getVehicleBySlug('mobil-tidak-ada')).toBeNull();
  });

  it('menyertakan rute tanpa tarif', async () => {
    const rute = await getPublishedRoutes();
    expect(rute.some((r) => r.price === null)).toBe(true);
  });

  it('mengembalikan pengaturan lengkap dengan alamat LIANS', async () => {
    const s = await getSettings();
    expect(s.address).toContain('Pomorow');
    expect(s.driverFeePerDay).toBeGreaterThan(0);
  });

  it('menyimpan teks hero dalam keempat bahasa', async () => {
    const s = await getSettings();
    expect(s.heroTitle.id).toBeTruthy();
    expect(s.heroTitle.en).toBeTruthy();
    expect(s.heroTitle.zh).toBeTruthy();
    expect(s.heroTitle.ko).toBeTruthy();
  });

  it('menyimpan fasilitas kendaraan sebagai objek berkunci bahasa', async () => {
    const [v] = await getPublishedVehicles();
    expect(Array.isArray(v.features.id)).toBe(true);
    expect(v.features.en?.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 7: Jalankan tes**

Run: `npm test -- tests/integration/queries.test.ts`
Expected: PASS, 5 tes

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: lapisan query dan data awal"
```

---
## Fase 2 — Situs Publik

### Task 8: Tema LIANS, layout publik, routing subdomain, dan routing bahasa

**Files:**
- Create: `proxy.ts`, `src/app/globals.css`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/WhatsAppFloat.tsx`, `src/components/layout/LanguageSwitcher.tsx`, `src/app/(public)/[locale]/layout.tsx`, `src/app/(public)/[locale]/error.tsx`, `src/app/(public)/[locale]/not-found.tsx`, `src/lib/cn.ts`
- Modify: `src/i18n/locale-path.ts` (tambah `toAppPath`), `src/app/layout.tsx` (atribut `lang` dinamis)
- Move: `src/app/page.tsx` → `src/app/(public)/[locale]/page.tsx`
- Test: `tests/components/layout.test.tsx`, `tests/unit/proxy.test.ts`

**Interfaces:**
- Consumes: `getSettings()` dari `@/queries/settings`, `formatRupiah` dari `@/lib/format`
- Produces:
  - `cn(...inputs: ClassValue[]): string` dari `@/lib/cn`
  - `<Header settings={SettingsInput} />`, `<Footer settings={SettingsInput} />` dari `@/components/layout`
  - `resolveHost(host: string, pathname: string): { kind: 'admin' | 'public' | 'blocked'; rewriteTo?: string }` dari `@/lib/host` — dipisah dari `proxy.ts` supaya bisa diuji tanpa runtime Next.js
  - `toAppPath(pathname: string): string` dari `@/i18n/locale-path` — path publik → path internal berawalan bahasa
  - `<LanguageSwitcher current={Locale} path={string} />` dari `@/components/layout/LanguageSwitcher`
  - Token CSS `--lians-blue`, kelas utilitas tema

- [ ] **Step 1: Tulis tes routing hostname yang gagal**

Create `tests/unit/proxy.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { resolveHost } from '@/lib/host';

describe('resolveHost', () => {
  it('menulis-ulang admin.lians.id ke grup rute admin', () => {
    expect(resolveHost('admin.lians.id', '/')).toEqual({ kind: 'admin', rewriteTo: '/admin' });
  });

  it('mempertahankan sisa path saat menulis-ulang', () => {
    expect(resolveHost('admin.lians.id', '/armada')).toEqual({
      kind: 'admin',
      rewriteTo: '/admin/armada',
    });
  });

  it('mengenali subdomain admin saat pengembangan lokal', () => {
    expect(resolveHost('admin.localhost:3000', '/booking')).toEqual({
      kind: 'admin',
      rewriteTo: '/admin/booking',
    });
  });

  it('melewatkan permintaan situs publik apa adanya', () => {
    expect(resolveHost('lians.id', '/mobil')).toEqual({ kind: 'public' });
  });

  it('memblokir /admin bila diakses dari domain publik', () => {
    expect(resolveHost('lians.id', '/admin/armada')).toEqual({ kind: 'blocked' });
  });

  it('tidak menulis-ulang dua kali bila path sudah diawali /admin', () => {
    expect(resolveHost('admin.lians.id', '/admin/armada')).toEqual({ kind: 'blocked' });
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/proxy.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/host"`

- [ ] **Step 3: Implementasi resolveHost**

Create `src/lib/host.ts`:

```ts
export type HostResolution =
  | { kind: 'admin'; rewriteTo: string }
  | { kind: 'public' }
  | { kind: 'blocked' };

/**
 * Panel admin hanya hidup di subdomainnya. Path /admin dari domain publik
 * diblokir supaya tidak ada dua pintu masuk ke halaman yang sama.
 */
export function resolveHost(host: string, pathname: string): HostResolution {
  const hostname = host.split(':')[0].toLowerCase();
  const isAdminHost = hostname === 'admin.localhost' || hostname.startsWith('admin.');

  if (pathname.startsWith('/admin')) return { kind: 'blocked' };
  if (!isAdminHost) return { kind: 'public' };

  return { kind: 'admin', rewriteTo: pathname === '/' ? '/admin' : `/admin${pathname}` };
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/proxy.test.ts`
Expected: PASS, 6 tes

- [ ] **Step 5: Pasang proxy**

Sejak Next.js 16, berkas `middleware.ts` berganti nama menjadi `proxy.ts` dan fungsinya diekspor sebagai `proxy`. Perilakunya identik.

Create `proxy.ts` (di akar proyek, bukan di `src/`):

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { resolveHost } from '@/lib/host';
import { splitLocalePath, toAppPath } from '@/i18n/locale-path';

export function proxy(req: NextRequest) {
  const hasil = resolveHost(req.headers.get('host') ?? '', req.nextUrl.pathname);

  if (hasil.kind === 'blocked') {
    return new NextResponse('Halaman tidak ditemukan', { status: 404 });
  }

  const url = req.nextUrl.clone();

  if (hasil.kind === 'admin') {
    url.pathname = hasil.rewriteTo;
    return NextResponse.rewrite(url);
  }

  // Sisi publik: setiap permintaan diarahkan ke segmen [locale].
  // /mobil → /id/mobil, /en/mobil → /en/mobil.
  const { locale } = splitLocalePath(req.nextUrl.pathname);
  url.pathname = toAppPath(req.nextUrl.pathname);

  // Root layout perlu tahu bahasanya untuk atribut <html lang>,
  // dan root layout tidak menerima params [locale].
  const headers = new Headers(req.headers);
  headers.set('x-lians-locale', locale);

  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

Tambahkan `toAppPath` ke `src/i18n/locale-path.ts`:

```ts
/** Path internal App Router — selalu diawali segmen bahasa, termasuk untuk Indonesia. */
export function toAppPath(pathname: string): string {
  const { locale, rest } = splitLocalePath(pathname);
  return rest === '/' ? `/${locale}` : `/${locale}${rest}`;
}
```

Tambahkan kasus uji ke `tests/unit/i18n.test.ts`:

```ts
describe('toAppPath', () => {
  it('memberi awalan bahasa Indonesia pada path tanpa awalan', () => {
    expect(toAppPath('/mobil')).toBe('/id/mobil');
    expect(toAppPath('/')).toBe('/id');
  });

  it('membiarkan path yang sudah berawalan bahasa lain', () => {
    expect(toAppPath('/en/mobil')).toBe('/en/mobil');
    expect(toAppPath('/ko')).toBe('/ko');
  });
});
```

Ingat menambahkan `toAppPath` ke daftar impor di berkas tes itu.

- [ ] **Step 6: Definisikan palet LIANS**

Replace `src/app/globals.css`:

```css
@import 'tailwindcss';

@theme {
  --color-lians-50: #eff7ff;
  --color-lians-100: #dbecfe;
  --color-lians-200: #bfdffe;
  --color-lians-300: #93cbfd;
  --color-lians-400: #60affa;
  --color-lians-500: #2e8bf0;
  --color-lians-600: #1f6fd6;
  --color-lians-700: #1a58ad;
  --color-lians-800: #1b4b8e;
  --color-lians-900: #1b4076;
  --color-ink: #0f172a;
  --color-muted: #64748b;
  --font-sans: var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif;
}

html {
  scroll-behavior: smooth;
}

body {
  background-color: #ffffff;
  color: var(--color-ink);
}
```

Create `src/lib/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Tulis tes komponen layout yang gagal**

Create `tests/components/layout.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';
import { DEFAULT_SETTINGS } from '@/queries/settings';

describe('Footer', () => {
  it('menampilkan alamat LIANS di Manado', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    expect(screen.getByText(/Pomorow/)).toBeInTheDocument();
    expect(screen.getByText(/Manado 95125/)).toBeInTheDocument();
  });

  it('menampilkan seluruh tautan navigasi utama', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    for (const label of ['Beranda', 'Kendaraan', 'Travel', 'Booking', 'Testimoni', 'Tentang', 'Kontak']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('menautkan WhatsApp ke nomor dari pengaturan', () => {
    render(<Footer settings={{ ...DEFAULT_SETTINGS, whatsappNumber: '081234567890' }} locale="id" />);
    const tautan = screen.getByRole('link', { name: /whatsapp/i });
    expect(tautan).toHaveAttribute('href', expect.stringContaining('wa.me/6281234567890'));
  });

  it('menerjemahkan navigasi dan memberi awalan bahasa pada tautan', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="en" />);
    expect(screen.getByRole('link', { name: 'Vehicles' })).toHaveAttribute('href', '/en/mobil');
  });

  it('menampilkan jam operasional dalam bahasa yang diminta', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="ko" />);
    expect(screen.getByText(/매일/)).toBeInTheDocument();
  });

  it('jatuh ke bahasa Indonesia bila terjemahan jam operasional kosong', () => {
    const settings = { ...DEFAULT_SETTINGS, operatingHours: { id: 'Setiap hari' } };
    render(<Footer settings={settings} locale="zh" />);
    expect(screen.getByText('Setiap hari')).toBeInTheDocument();
  });
});
```

- [ ] **Step 8: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/components/layout.test.tsx`
Expected: FAIL — komponen `Footer` belum ada

- [ ] **Step 9: Buat util WhatsApp yang dipakai Footer**

Create `src/lib/whatsapp.ts`:

```ts
/** 081234567890 dan +6281234567890 sama-sama menjadi 6281234567890. */
export function normalizePhone(phone: string): string {
  const digit = phone.replace(/\D/g, '');
  if (digit.startsWith('62')) return digit;
  if (digit.startsWith('0')) return `62${digit.slice(1)}`;
  return `62${digit}`;
}

export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhone(phone)}?text=${encodeURIComponent(message)}`;
}
```

- [ ] **Step 10: Implementasi navigasi bersama, Header, dan Footer**

Create `src/components/layout/nav-items.ts`:

```ts
import type { Messages } from '@/i18n';

/** `key` menunjuk ke kamus, bukan teks langsung — supaya label ikut berganti bahasa. */
export const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/mobil', key: 'vehicles' },
  { href: '/travel', key: 'travel' },
  { href: '/booking', key: 'booking' },
  { href: '/testimoni', key: 'testimonials' },
  { href: '/tentang', key: 'about' },
  { href: '/kontak', key: 'contact' },
] as const satisfies readonly { href: string; key: keyof Messages['nav'] }[];
```

Create `src/components/layout/Footer.tsx`:

```tsx
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import type { SettingsInput } from '@/schemas/settings';
import { normalizePhone } from '@/lib/whatsapp';
import { getMessages, fill, pickLocale, localeHref, type Locale } from '@/i18n';
import { NAV_ITEMS } from './nav-items';

export function Footer({ settings, locale }: { settings: SettingsInput; locale: Locale }) {
  const t = getMessages(locale);
  const tahun = new Date().getFullYear();
  const wa = normalizePhone(settings.whatsappNumber);

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <p className="text-xl font-black tracking-wide text-lians-600">LIANS</p>
          <p className="text-sm leading-relaxed text-muted">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.navigation} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t.footer.navigation}</h2>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={localeHref(item.href, locale)}
                  className="text-sm text-muted hover:text-lians-600"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t.footer.contactHeading}</h2>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
              <span>{settings.address}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
              <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            </li>
            <li className="flex gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
              <a href={`https://wa.me/${wa}`} aria-label="WhatsApp LIANS">
                {t.contact.whatsapp}
              </a>
            </li>
            {settings.email ? (
              <li className="flex gap-2">
                <Mail className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t.footer.hoursHeading}</h2>
          <p className="flex gap-2 text-sm text-muted">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
            <span>{pickLocale(settings.operatingHours, locale)}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 py-5 text-center text-xs text-muted">
        {fill(t.footer.rights, { tahun })}
      </div>
    </footer>
  );
}
```

Create `src/components/layout/Header.tsx`:

```tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getMessages, localeHref, splitLocalePath, type Locale } from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NAV_ITEMS } from './nav-items';

export function Header({ whatsappUrl, locale }: { whatsappUrl: string; locale: Locale }) {
  const t = getMessages(locale);
  const pathname = usePathname();
  const { rest } = splitLocalePath(pathname);
  const [terbuka, setTerbuka] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href={localeHref('/', locale)} className="flex items-center gap-2" aria-label="LIANS">
          <Image src="/logo-lians.png" alt="LIANS" width={120} height={32} priority />
        </Link>

        <nav aria-label={t.nav.home} className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={localeHref(item.href, locale)}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                rest === item.href
                  ? 'bg-lians-50 text-lians-700'
                  : 'text-slate-600 hover:text-lians-600',
              )}
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher current={locale} path={rest} />
          <a
            href={whatsappUrl}
            className="hidden rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600 sm:inline-block"
          >
            {t.nav.contactUs}
          </a>
          <button
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            aria-expanded={terbuka}
            aria-label={terbuka ? t.nav.closeMenu : t.nav.openMenu}
            className="rounded-lg p-2 lg:hidden"
          >
            {terbuka ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {terbuka ? (
        <nav aria-label={t.nav.openMenu} className="border-t border-slate-200 lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={localeHref(item.href, locale)}
                  onClick={() => setTerbuka(false)}
                  className="block py-3 text-sm font-medium text-slate-700"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
```

Create `src/components/layout/LanguageSwitcher.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LOCALES, LOCALE_LABELS, localeHref, getMessages, type Locale } from '@/i18n';

/**
 * Menautkan ke halaman yang sama dalam bahasa lain, bukan ke beranda.
 * Orang yang sedang membaca halaman Innova ingin membacanya dalam bahasa lain,
 * bukan dilempar kembali ke awal.
 */
export function LanguageSwitcher({ current, path }: { current: Locale; path: string }) {
  const t = getMessages(current);

  return (
    <nav aria-label={t.nav.language} className="flex items-center gap-1">
      <Globe className="mr-0.5 h-4 w-4 text-slate-400" aria-hidden />
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={localeHref(path, locale)}
          hrefLang={locale}
          aria-current={locale === current ? 'true' : undefined}
          className={cn(
            'rounded-md px-2 py-1 text-xs font-semibold transition-colors',
            locale === current
              ? 'bg-lians-50 text-lians-700'
              : 'text-slate-500 hover:text-lians-600',
          )}
        >
          {LOCALE_LABELS[locale]}
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 11: Buat layout publik berbahasa**

Create `src/app/(public)/[locale]/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { getSettings } from '@/queries/settings';
import { normalizePhone } from '@/lib/whatsapp';
import { LOCALES, isLocale } from '@/i18n';

export const revalidate = 300;

/** Keempat bahasa dibangun sebagai halaman statis saat build. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function PublicLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const settings = await getSettings();
  const whatsappUrl = `https://wa.me/${normalizePhone(settings.whatsappNumber)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header whatsappUrl={whatsappUrl} locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} locale={locale} />
      <WhatsAppFloat url={whatsappUrl} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
```

Setiap halaman publik pada tugas-tugas berikutnya menerima `params: Promise<{ locale: Locale }>`, memanggil `getMessages(locale)` untuk label, dan `pickLocale(field, locale)` untuk isi database.

Create `src/components/layout/WhatsAppFloat.tsx`:

```tsx
import { MessageCircle } from 'lucide-react';

export function WhatsAppFloat({ url }: { url: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Hubungi LIANS lewat WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg hover:bg-emerald-600"
    >
      <MessageCircle className="h-6 w-6" aria-hidden />
    </a>
  );
}
```

- [ ] **Step 12: Buat halaman error dan 404**

Create `src/app/(public)/[locale]/error.tsx`:

```tsx
'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Terjadi gangguan</h1>
      <p className="mt-2 text-muted">
        Halaman ini sedang tidak bisa dimuat. Silakan coba lagi, atau hubungi kami langsung lewat
        WhatsApp.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-lians-500 px-5 py-2.5 font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
```

Create `src/app/(public)/[locale]/not-found.tsx`:

```tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <h1 className="text-2xl font-bold">Halaman tidak ditemukan</h1>
      <p className="mt-2 text-muted">Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-lians-500 px-5 py-2.5 font-semibold text-white">
        Kembali ke beranda
      </Link>
    </div>
  );
}
```

- [ ] **Step 13: Pindahkan halaman beranda ke grup publik**

```bash
mkdir -p "src/app/(public)/[locale]"
git mv src/app/page.tsx "src/app/(public)/[locale]/page.tsx"
```

- [ ] **Step 14: Buat atribut `lang` mengikuti bahasa halaman**

Root layout tidak menerima `params`, jadi bahasanya dibaca dari header yang dipasang proxy.

Modify `src/app/layout.tsx`:

```tsx
import { headers } from 'next/headers';
import { DEFAULT_LOCALE, LOCALE_HTML_LANG, isLocale } from '@/i18n';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const dariMiddleware = (await headers()).get('x-lians-locale') ?? '';
  const locale = isLocale(dariMiddleware) ? dariMiddleware : DEFAULT_LOCALE;

  return (
    <html lang={LOCALE_HTML_LANG[locale]} className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

Atribut `lang` yang benar bukan sekadar formalitas: pembaca layar memilih suara dan pelafalan berdasarkan itu, dan Google memakainya sebagai sinyal bahasa halaman.

- [ ] **Step 15: Simpan logo**

Salin berkas logo LIANS yang disediakan pemilik ke `public/logo-lians.png`. Bila belum tersedia, buat penampung sementara agar `next/image` tidak error, dan catat sebagai utang yang harus diganti sebelum peluncuran:

```bash
cp ../website-rental-mobil/public/favicon.svg public/logo-lians.png
```

- [ ] **Step 16: Jalankan tes dan build**

Run: `npm test -- tests/components/layout.test.tsx && npm run build`
Expected: PASS 6 tes, build sukses

- [ ] **Step 17: Verifikasi subdomain dan bahasa secara lokal**

Run: `npm run dev`, lalu periksa:

1. `http://admin.localhost:3000` → 404 Next.js (rute `/admin` belum dibuat di Task 14), bukan halaman publik. Ini membuktikan penulisan-ulang hostname bekerja.
2. `http://localhost:3000/` → halaman berbahasa Indonesia, `<html lang="id-ID">`
3. `http://localhost:3000/en` → navigasi berbahasa Inggris, `<html lang="en">`
4. `http://localhost:3000/ko` → navigasi berbahasa Korea
5. Klik pemilih bahasa dari `/en` → berpindah ke `/ko` pada halaman yang sama, bukan ke beranda

- [ ] **Step 18: Commit**

```bash
git add -A
git commit -m "feat: tema LIANS, layout publik, routing subdomain, dan routing bahasa"
```

---
### Task 9: Katalog kendaraan dengan pencarian, filter, dan pengurutan

**Files:**
- Create: `src/lib/vehicle-filter.ts`, `src/components/vehicle/VehicleCard.tsx`, `src/components/vehicle/VehicleGrid.tsx`, `src/components/vehicle/CatalogControls.tsx`, `src/app/(public)/[locale]/mobil/page.tsx`
- Test: `tests/unit/vehicle-filter.test.ts`, `tests/components/vehicle.test.tsx`

**Interfaces:**
- Consumes: `getPublishedVehicles()` dari `@/queries/vehicles`, `formatRupiah`, `Vehicle` dari `@/db/schema`
- Produces:
  - `type CatalogFilters = { q?: string; category?: string; maxPrice?: number; sort?: 'harga-asc' | 'harga-desc' | 'nama-asc' }` dari `@/lib/vehicle-filter`
  - `filterAndSortVehicles(vehicles: Vehicle[], filters: CatalogFilters): Vehicle[]` dari `@/lib/vehicle-filter`
  - `parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters` dari `@/lib/vehicle-filter`
  - `<VehicleCard vehicle={Vehicle} locale={Locale} />` dari `@/components/vehicle/VehicleCard`

Filter dijalankan di server terhadap hasil query. Katalog LIANS berisi puluhan kendaraan, bukan puluhan ribu — memfilter di memori jauh lebih sederhana daripada menyusun klausa SQL dinamis, dan tetap cepat.

- [ ] **Step 1: Tulis tes filter yang gagal**

Create `tests/unit/vehicle-filter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { filterAndSortVehicles, parseCatalogFilters } from '@/lib/vehicle-filter';
import type { Vehicle } from '@/db/schema';

const buat = (over: Partial<Vehicle>): Vehicle =>
  ({
    id: crypto.randomUUID(),
    slug: 'x',
    name: 'Mobil',
    category: 'mpv',
    images: [],
    rate24h: 500000,
    rate12h: null,
    driverFeeOverride: null,
    serviceTypes: ['self-drive'],
    seats: 7,
    transmission: 'manual',
    fuelType: 'petrol',
    year: 2023,
    luggage: 2,
    features: [],
    rentalTerms: [],
    status: 'available',
    isPublished: true,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  }) as Vehicle;

const armada = [
  buat({ name: 'All New Brio', category: 'hatchback', rate24h: 350000 }),
  buat({ name: 'Toyota Avanza', category: 'mpv', rate24h: 400000 }),
  buat({ name: 'Toyota Fortuner', category: 'suv', rate24h: 1200000 }),
];

describe('filterAndSortVehicles', () => {
  it('mengembalikan semua kendaraan bila tidak ada filter', () => {
    expect(filterAndSortVehicles(armada, {})).toHaveLength(3);
  });

  it('mencari berdasarkan nama tanpa peduli huruf besar-kecil', () => {
    const hasil = filterAndSortVehicles(armada, { q: 'brio' });
    expect(hasil.map((v) => v.name)).toEqual(['All New Brio']);
  });

  it('menyaring berdasarkan kategori', () => {
    const hasil = filterAndSortVehicles(armada, { category: 'suv' });
    expect(hasil.map((v) => v.name)).toEqual(['Toyota Fortuner']);
  });

  it('menyaring berdasarkan harga maksimum', () => {
    const hasil = filterAndSortVehicles(armada, { maxPrice: 450000 });
    expect(hasil).toHaveLength(2);
  });

  it('mengurutkan dari harga termurah', () => {
    const hasil = filterAndSortVehicles(armada, { sort: 'harga-asc' });
    expect(hasil.map((v) => v.rate24h)).toEqual([350000, 400000, 1200000]);
  });

  it('mengurutkan dari harga termahal', () => {
    const hasil = filterAndSortVehicles(armada, { sort: 'harga-desc' });
    expect(hasil.map((v) => v.rate24h)).toEqual([1200000, 400000, 350000]);
  });

  it('mengurutkan berdasarkan nama', () => {
    const hasil = filterAndSortVehicles(armada, { sort: 'nama-asc' });
    expect(hasil[0].name).toBe('All New Brio');
  });

  it('tidak mengubah array masukan', () => {
    const salinan = [...armada];
    filterAndSortVehicles(armada, { sort: 'harga-desc' });
    expect(armada).toEqual(salinan);
  });

  it('menggabungkan pencarian dan filter kategori', () => {
    const hasil = filterAndSortVehicles(armada, { q: 'toyota', category: 'mpv' });
    expect(hasil.map((v) => v.name)).toEqual(['Toyota Avanza']);
  });
});

describe('parseCatalogFilters', () => {
  it('membaca parameter URL menjadi filter', () => {
    expect(parseCatalogFilters({ q: 'brio', category: 'suv', maxPrice: '500000', sort: 'harga-asc' }))
      .toEqual({ q: 'brio', category: 'suv', maxPrice: 500000, sort: 'harga-asc' });
  });

  it('mengabaikan harga maksimum yang bukan angka', () => {
    expect(parseCatalogFilters({ maxPrice: 'mahal' }).maxPrice).toBeUndefined();
  });

  it('mengabaikan urutan yang tidak dikenal', () => {
    expect(parseCatalogFilters({ sort: 'acak' }).sort).toBeUndefined();
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/vehicle-filter.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/vehicle-filter"`

- [ ] **Step 3: Implementasi filter**

Create `src/lib/vehicle-filter.ts`:

```ts
import type { Vehicle } from '@/db/schema';

export type CatalogSort = 'harga-asc' | 'harga-desc' | 'nama-asc';

export type CatalogFilters = {
  q?: string;
  category?: string;
  maxPrice?: number;
  sort?: CatalogSort;
};

const URUTAN_VALID: CatalogSort[] = ['harga-asc', 'harga-desc', 'nama-asc'];

export function parseCatalogFilters(
  params: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const ambil = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };

  const filters: CatalogFilters = {};

  const q = ambil('q')?.trim();
  if (q) filters.q = q;

  const category = ambil('category')?.trim();
  if (category) filters.category = category;

  const maxPrice = Number(ambil('maxPrice'));
  if (Number.isFinite(maxPrice) && maxPrice > 0) filters.maxPrice = maxPrice;

  const sort = ambil('sort') as CatalogSort | undefined;
  if (sort && URUTAN_VALID.includes(sort)) filters.sort = sort;

  return filters;
}

export function filterAndSortVehicles(vehicles: Vehicle[], filters: CatalogFilters): Vehicle[] {
  const q = filters.q?.toLowerCase();

  const hasil = vehicles.filter((v) => {
    if (q && !v.name.toLowerCase().includes(q) && !v.category.toLowerCase().includes(q)) {
      return false;
    }
    if (filters.category && v.category !== filters.category) return false;
    if (filters.maxPrice !== undefined && v.rate24h > filters.maxPrice) return false;
    return true;
  });

  switch (filters.sort) {
    case 'harga-asc':
      return [...hasil].sort((a, b) => a.rate24h - b.rate24h);
    case 'harga-desc':
      return [...hasil].sort((a, b) => b.rate24h - a.rate24h);
    case 'nama-asc':
      return [...hasil].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    default:
      return hasil;
  }
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/vehicle-filter.test.ts`
Expected: PASS, 12 tes

- [ ] **Step 5: Tulis tes komponen kartu kendaraan yang gagal**

Create `tests/components/vehicle.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import type { Vehicle } from '@/db/schema';

const dasar = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'innova-zenix-g',
  name: 'Innova Zenix G',
  category: 'mpv',
  images: [],
  rate24h: 900000,
  rate12h: 650000,
  driverFeeOverride: null,
  serviceTypes: ['self-drive', 'with-driver'],
  seats: 7,
  transmission: 'automatic',
  fuelType: 'petrol',
  year: 2024,
  luggage: 3,
  features: [],
  rentalTerms: [],
  status: 'available',
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Vehicle;

describe('VehicleCard', () => {
  it('menampilkan nama dan tarif 24 jam dalam rupiah', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByText('Innova Zenix G')).toBeInTheDocument();
    expect(screen.getByText(/Rp 900\.000/)).toBeInTheDocument();
  });

  it('menampilkan tarif 12 jam bila tersedia', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByText(/Rp 650\.000/)).toBeInTheDocument();
  });

  it('menyembunyikan tarif 12 jam bila kendaraan tidak punya', () => {
    render(<VehicleCard vehicle={{ ...dasar, rate12h: null }} locale="id" />);
    expect(screen.queryByText(/12 jam/i)).not.toBeInTheDocument();
  });

  it('menautkan ke halaman detail kendaraan', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByRole('link', { name: /Innova Zenix G/ })).toHaveAttribute(
      'href',
      '/mobil/innova-zenix-g',
    );
  });

  it('memberi awalan bahasa pada tautan detail', () => {
    render(<VehicleCard vehicle={dasar} locale="zh" />);
    expect(screen.getByRole('link', { name: /Innova Zenix G/ })).toHaveAttribute(
      'href',
      '/zh/mobil/innova-zenix-g',
    );
  });

  it('menandai kendaraan yang sedang tidak tersedia', () => {
    render(<VehicleCard vehicle={{ ...dasar, status: 'unavailable' }} locale="id" />);
    expect(screen.getByText(/sedang tersewa/i)).toBeInTheDocument();
  });

  it('menerjemahkan label satuan tarif', () => {
    render(<VehicleCard vehicle={dasar} locale="en" />);
    expect(screen.getByText('per 24 hours')).toBeInTheDocument();
  });

  it('tidak menerjemahkan nama kendaraan', () => {
    render(<VehicleCard vehicle={dasar} locale="ko" />);
    expect(screen.getByText('Innova Zenix G')).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/components/vehicle.test.tsx`
Expected: FAIL — komponen `VehicleCard` belum ada

- [ ] **Step 7: Implementasi VehicleCard dan VehicleGrid**

Create `src/components/vehicle/VehicleCard.tsx`:

```tsx
import Link from 'next/link';
import Image from 'next/image';
import { Users, Cog, Fuel, Briefcase } from 'lucide-react';
import type { Vehicle } from '@/db/schema';
import { formatRupiah } from '@/lib/format';
import { getMessages, localeHref, type Locale } from '@/i18n';

const LABEL_KATEGORI: Record<string, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  mpv: 'MPV',
  luxury: 'Luxury',
  bus: 'Bus / Hiace',
};

export function VehicleCard({ vehicle, locale }: { vehicle: Vehicle; locale: Locale }) {
  const t = getMessages(locale);
  const gambar = vehicle.images[0];
  const tersedia = vehicle.status === 'available';

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-slate-100">
        {gambar ? (
          <Image
            src={gambar.url}
            alt={gambar.alt || vehicle.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {t.common.photoComingSoon}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-lians-700">
          {LABEL_KATEGORI[vehicle.category] ?? vehicle.category}
        </span>
        {!tersedia ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {t.common.unavailable}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <h3 className="text-lg font-bold">
          <Link href={localeHref(`/mobil/${vehicle.slug}`, locale)} className="after:absolute after:inset-0">
            {vehicle.name}
          </Link>
        </h3>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden /> {vehicle.seats} {t.common.seats}
          </li>
          <li className="flex items-center gap-1">
            <Cog className="h-3.5 w-3.5" aria-hidden />
            {vehicle.transmission === 'automatic' ? t.common.automatic : t.common.manual}
          </li>
          <li className="flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5" aria-hidden /> {vehicle.year}
          </li>
          <li className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" aria-hidden /> {vehicle.luggage} {t.common.luggage}
          </li>
        </ul>

        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-lg font-black text-lians-600">{formatRupiah(vehicle.rate24h)}</p>
            <p className="text-xs text-muted">{t.common.perDay24}</p>
          </div>
          {vehicle.rate12h !== null ? (
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{formatRupiah(vehicle.rate12h)}</p>
              <p className="text-xs text-muted">{t.common.perDay12}</p>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
```

Create `src/components/vehicle/VehicleGrid.tsx`:

```tsx
import type { Vehicle } from '@/db/schema';
import { getMessages, type Locale } from '@/i18n';
import { VehicleCard } from './VehicleCard';

export function VehicleGrid({ vehicles, locale }: { vehicles: Vehicle[]; locale: Locale }) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
        {getMessages(locale).catalog.empty}
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} vehicle={v} locale={locale} />
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/vehicle.test.tsx`
Expected: PASS, 5 tes

- [ ] **Step 9: Buat kontrol katalog**

Kontrol memakai `<form method="get">` biasa sehingga filter tercermin di URL — bisa dibagikan, bisa ditandai, dan tetap berfungsi tanpa JavaScript.

Create `src/components/vehicle/CatalogControls.tsx`:

```tsx
import type { CatalogFilters } from '@/lib/vehicle-filter';
import { getMessages, type Locale } from '@/i18n';

const kelasInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lians-500 focus:outline-none focus:ring-2 focus:ring-lians-200';

export function CatalogControls({
  filters,
  locale,
}: {
  filters: CatalogFilters;
  locale: Locale;
}) {
  const t = getMessages(locale);

  const KATEGORI = [
    { value: '', label: t.catalog.allCategories },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'mpv', label: 'MPV' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'bus', label: 'Bus / Hiace' },
  ];

  const URUTAN = [
    { value: '', label: t.catalog.sortDefault },
    { value: 'harga-asc', label: t.catalog.sortPriceAsc },
    { value: 'harga-desc', label: t.catalog.sortPriceDesc },
    { value: 'nama-asc', label: t.catalog.sortNameAsc },
  ];

  return (
    <form method="get" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="lg:col-span-2">
        <span className="mb-1 block text-xs font-semibold text-slate-600">{t.catalog.search}</span>
        <input
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder={t.catalog.searchPlaceholder}
          className={kelasInput}
        />
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">{t.catalog.category}</span>
        <select name="category" defaultValue={filters.category ?? ''} className={kelasInput}>
          {KATEGORI.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">{t.catalog.maxPrice}</span>
        <input
          name="maxPrice"
          type="number"
          min={0}
          step={50000}
          defaultValue={filters.maxPrice ?? ''}
          placeholder="1000000"
          className={kelasInput}
        />
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">{t.catalog.sort}</span>
        <select name="sort" defaultValue={filters.sort ?? ''} className={kelasInput}>
          {URUTAN.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2 lg:col-span-5">
        <button type="submit" className="rounded-lg bg-lians-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lians-600">
          {t.catalog.apply}
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 10: Buat halaman katalog**

Create `src/app/(public)/[locale]/mobil/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { filterAndSortVehicles, parseCatalogFilters } from '@/lib/vehicle-filter';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { CatalogControls } from '@/components/vehicle/CatalogControls';
import { getMessages, fill, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Daftar Kendaraan Rental — LIANS Manado',
    description:
      'Pilihan armada rental mobil LIANS di Manado: hatchback, MPV, SUV, mobil mewah, dan Hiace pariwisata. Tarif 24 jam dan 12 jam.',
  },
  en: {
    title: 'Rental Fleet — LIANS Manado',
    description:
      'LIANS car rental fleet in Manado: hatchbacks, MPVs, SUVs, luxury cars, and Hiace tour vans. 24-hour and 12-hour rates.',
  },
  zh: {
    title: '租车车型一览 — 万鸦老 LIANS',
    description:
      'LIANS 万鸦老租车车队：两厢车、MPV、SUV、豪华轿车与 Hiace 旅游车。提供 24 小时与 12 小时套餐。',
  },
  ko: {
    title: '렌터카 차량 목록 — 마나도 LIANS',
    description:
      'LIANS 마나도 렌터카 차량: 해치백, MPV, SUV, 고급 차량, 하이에스 관광차. 24시간 및 12시간 요금제.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/mobil', locale) };
}

export default async function MobilPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = getMessages(locale);
  const filters = parseCatalogFilters(sp);
  const semua = await getPublishedVehicles();
  const hasil = filterAndSortVehicles(semua, filters);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.catalog.title}</h1>
        <p className="max-w-2xl text-muted">{t.catalog.subtitle}</p>
      </header>

      <CatalogControls filters={filters} locale={locale} />

      <p className="text-sm text-muted">
        {fill(t.catalog.showing, { n: hasil.length, total: semua.length })}
      </p>

      <VehicleGrid vehicles={hasil} locale={locale} />
    </div>
  );
}
```

Judul dan deskripsi metadata ditulis per bahasa sebagai konstanta, bukan diambil dari kamus, karena keduanya adalah kalimat pemasaran yang wajar berbeda susunannya di tiap bahasa — bukan label antarmuka yang tinggal disalin.

- [ ] **Step 11: Jalankan seluruh tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: katalog kendaraan dengan pencarian, filter, dan pengurutan"
```

---
### Task 10: Halaman detail kendaraan, SEO, dan sitemap

**Files:**
- Create: `src/app/(public)/[locale]/mobil/[slug]/page.tsx`, `src/components/vehicle/VehicleGallery.tsx`, `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx` (metadata dasar + font)
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Consumes: `getVehicleBySlug`, `getPublishedVehicles`, `getSettings`
- Produces:
  - `buildAutoRentalJsonLd(args: { settings: SettingsInput; priceRange: string; url: string; locale: Locale }): object` dari `@/lib/seo`
  - `buildVehicleJsonLd(args: { vehicle: Vehicle; url: string }): object` dari `@/lib/seo`
  - `buildAlternates(path: string, locale: Locale): { canonical: string; languages: Record<string, string> }` dari `@/lib/seo`
  - `SITE_URL: string` dari `@/lib/seo`

- [ ] **Step 1: Tulis tes SEO yang gagal**

Create `tests/unit/seo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildAutoRentalJsonLd, buildVehicleJsonLd, buildAlternates } from '@/lib/seo';
import { DEFAULT_SETTINGS } from '@/queries/settings';

describe('buildAutoRentalJsonLd', () => {
  const jsonLd = buildAutoRentalJsonLd({
    settings: DEFAULT_SETTINGS,
    priceRange: 'Rp 350.000 - Rp 2.500.000',
    url: 'https://lians.id',
    locale: 'id',
  }) as Record<string, unknown>;

  it('memakai tipe AutoRental', () => {
    expect(jsonLd['@type']).toBe('AutoRental');
  });

  it('menyertakan alamat Manado yang lengkap', () => {
    const alamat = jsonLd.address as Record<string, string>;
    expect(alamat.addressLocality).toBe('Manado');
    expect(alamat.postalCode).toBe('95125');
    expect(alamat.streetAddress).toContain('Pomorow');
  });

  it('menyertakan nama bisnis LIANS', () => {
    expect(jsonLd.name).toBe('LIANS');
  });
});

describe('buildAlternates', () => {
  const alt = buildAlternates('/mobil/innova-zenix-g', 'en');

  it('menjadikan versi bahasa aktif sebagai canonical', () => {
    expect(alt.canonical).toBe('https://lians.id/en/mobil/innova-zenix-g');
  });

  it('mendaftarkan keempat bahasa', () => {
    expect(alt.languages['id-ID']).toBe('https://lians.id/mobil/innova-zenix-g');
    expect(alt.languages['en']).toBe('https://lians.id/en/mobil/innova-zenix-g');
    expect(alt.languages['zh-CN']).toBe('https://lians.id/zh/mobil/innova-zenix-g');
    expect(alt.languages['ko-KR']).toBe('https://lians.id/ko/mobil/innova-zenix-g');
  });

  it('menunjuk x-default ke versi Indonesia', () => {
    expect(alt.languages['x-default']).toBe('https://lians.id/mobil/innova-zenix-g');
  });

  it('tidak memberi awalan pada URL bahasa Indonesia', () => {
    expect(buildAlternates('/', 'id').canonical).toBe('https://lians.id/');
  });
});

describe('buildVehicleJsonLd', () => {
  it('menyusun penawaran dengan mata uang IDR', () => {
    const jsonLd = buildVehicleJsonLd({
      vehicle: { name: 'Innova Zenix G', rate24h: 900000, seats: 7, year: 2024 } as never,
      url: 'https://lians.id/mobil/innova-zenix-g',
    }) as Record<string, unknown>;
    const offer = jsonLd.offers as Record<string, unknown>;
    expect(offer.priceCurrency).toBe('IDR');
    expect(offer.price).toBe(900000);
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/seo.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/seo"`

- [ ] **Step 3: Implementasi util SEO**

Create `src/lib/seo.ts`:

```ts
import type { Vehicle } from '@/db/schema';
import type { SettingsInput } from '@/schemas/settings';
import { LOCALES, LOCALE_HTML_LANG, DEFAULT_LOCALE, localeHref, pickLocale, type Locale } from '@/i18n';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lians.id';

/**
 * hreflang untuk keempat bahasa plus x-default.
 * Tanpa ini Google bisa menyajikan halaman berbahasa Indonesia
 * kepada orang yang mencari dalam bahasa Korea.
 */
export function buildAlternates(path: string, locale: Locale) {
  const languages: Record<string, string> = {};

  for (const l of LOCALES) {
    languages[LOCALE_HTML_LANG[l]] = `${SITE_URL}${localeHref(path, l)}`;
  }
  languages['x-default'] = `${SITE_URL}${localeHref(path, DEFAULT_LOCALE)}`;

  return { canonical: `${SITE_URL}${localeHref(path, locale)}`, languages };
}

export function buildAutoRentalJsonLd(args: {
  settings: SettingsInput;
  priceRange: string;
  url: string;
  locale: Locale;
}) {
  const { settings, priceRange, url, locale } = args;
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: 'LIANS',
    description: pickLocale(settings.heroSubtitle, locale) ?? '',
    url,
    telephone: settings.phone,
    priceRange,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Jalan Pomorow (Depan Luwansa Hotel)',
      addressLocality: 'Manado',
      addressRegion: 'Sulawesi Utara',
      postalCode: '95125',
      addressCountry: 'ID',
    },
    areaServed: { '@type': 'City', name: 'Manado' },
    openingHours: pickLocale(settings.operatingHours, locale) ?? '',
  };
}

export function buildVehicleJsonLd(args: { vehicle: Vehicle; url: string }) {
  const { vehicle, url } = args;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: vehicle.name,
    url,
    brand: { '@type': 'Brand', name: 'LIANS' },
    offers: {
      '@type': 'Offer',
      price: vehicle.rate24h,
      priceCurrency: 'IDR',
      availability:
        vehicle.status === 'available'
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      url,
    },
  };
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/seo.test.ts`
Expected: PASS, 4 tes

- [ ] **Step 5: Buat galeri kendaraan**

Create `src/components/vehicle/VehicleGallery.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { VehicleImage } from '@/db/schema';

export function VehicleGallery({ images, alt }: { images: VehicleImage[]; alt: string }) {
  const [aktif, setAktif] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-muted">
        Foto menyusul
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={images[aktif].url}
          alt={images[aktif].alt || alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.publicId || img.url}>
              <button
                type="button"
                onClick={() => setAktif(i)}
                aria-label={`Lihat foto ${i + 1} dari ${alt}`}
                aria-current={i === aktif}
                className={cn(
                  'relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2',
                  i === aktif ? 'border-lians-500' : 'border-transparent',
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 6: Buat halaman detail kendaraan**

Create `src/app/(public)/[locale]/mobil/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Users, Cog, Fuel, Briefcase, Calendar } from 'lucide-react';
import { getPublishedVehicles, getVehicleBySlug } from '@/queries/vehicles';
import { getSettings } from '@/queries/settings';
import { formatRupiah } from '@/lib/format';
import { VehicleGallery } from '@/components/vehicle/VehicleGallery';
import { buildVehicleJsonLd, buildAlternates, SITE_URL } from '@/lib/seo';
import { waLink } from '@/lib/whatsapp';
import { getMessages, fill, pickLocale, localeHref, LOCALES, type Locale } from '@/i18n';

export const revalidate = 300;

export async function generateStaticParams() {
  const semua = await getPublishedVehicles();
  return LOCALES.flatMap((locale) => semua.map((v) => ({ locale, slug: v.slug })));
}

/** Judul halaman per bahasa. Nama kendaraan tidak diterjemahkan. */
const JUDUL: Record<Locale, (nama: string, harga: string) => string> = {
  id: (nama, harga) => `Sewa ${nama} di Manado — ${harga}/24 jam | LIANS`,
  en: (nama, harga) => `Rent ${nama} in Manado — ${harga}/24 hours | LIANS`,
  zh: (nama, harga) => `万鸦老租 ${nama} — ${harga}/24 小时 | LIANS`,
  ko: (nama, harga) => `마나도 ${nama} 렌트 — ${harga}/24시간 | LIANS`,
};

const DESKRIPSI: Record<Locale, (v: { name: string; year: number; seats: number }) => string> = {
  id: (v) => `Rental ${v.name} tahun ${v.year}, ${v.seats} kursi. Lepas kunci atau dengan sopir di Manado. Hubungi LIANS.`,
  en: (v) => `Rent a ${v.year} ${v.name}, ${v.seats} seats. Self-drive or with driver in Manado. Contact LIANS.`,
  zh: (v) => `${v.year} 年 ${v.name}，${v.seats} 座。万鸦老自驾或含司机租车，请联系 LIANS。`,
  ko: (v) => `${v.year}년식 ${v.name}, ${v.seats}인승. 마나도 자차 운전 또는 기사 포함 렌트. LIANS로 문의하세요.`,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: 'LIANS' };

  const judul = JUDUL[locale](v.name, formatRupiah(v.rate24h));
  return {
    title: judul,
    description: DESKRIPSI[locale](v),
    alternates: buildAlternates(`/mobil/${v.slug}`, locale),
    openGraph: { title: judul, images: v.images[0] ? [v.images[0].url] : [] },
  };
}

export default async function DetailMobilPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [vehicle, settings] = await Promise.all([getVehicleBySlug(slug), getSettings()]);

  if (!vehicle || !vehicle.isPublished) notFound();

  const t = getMessages(locale);
  const tersedia = vehicle.status === 'available';
  const jsonLd = buildVehicleJsonLd({
    vehicle,
    url: `${SITE_URL}${localeHref(`/mobil/${vehicle.slug}`, locale)}`,
  });
  const fitur = pickLocale(vehicle.features, locale) ?? [];
  const syarat = pickLocale(vehicle.rentalTerms, locale) ?? [];
  const pesanWa = `Halo LIANS, saya ingin menanyakan ketersediaan ${vehicle.name}.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted">
        <Link href={localeHref('/mobil', locale)} className="hover:text-lians-600">
          {t.nav.vehicles}
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{vehicle.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <VehicleGallery images={vehicle.images} alt={vehicle.name} />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{vehicle.name}</h1>
            {!tersedia ? (
              <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                {t.vehicle.unavailableNote}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-lians-200 bg-lians-50 p-4">
              <p className="text-xs font-semibold text-lians-700">{t.vehicle.rate24}</p>
              <p className="text-2xl font-black text-lians-700">{formatRupiah(vehicle.rate24h)}</p>
            </div>
            {vehicle.rate12h !== null ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-600">{t.vehicle.rate12}</p>
                <p className="text-2xl font-black">{formatRupiah(vehicle.rate12h)}</p>
              </div>
            ) : null}
          </div>

          <p className="text-sm text-muted">
            {fill(t.vehicle.driverFeeNote, {
              harga: formatRupiah(vehicle.driverFeeOverride ?? settings.driverFeePerDay),
            })}
          </p>

          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-3">
            {[
              { Icon: Users, label: t.vehicle.capacity, value: `${vehicle.seats} ${t.common.seats}` },
              { Icon: Cog, label: t.vehicle.transmission, value: vehicle.transmission === 'automatic' ? t.common.automatic : t.common.manual },
              { Icon: Fuel, label: t.vehicle.fuel, value: vehicle.fuelType },
              { Icon: Calendar, label: t.vehicle.year, value: String(vehicle.year) },
              { Icon: Briefcase, label: t.vehicle.luggageLabel, value: `${vehicle.luggage} ${t.common.luggage}` },
            ].map(({ Icon, label, value }) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                </dt>
                <dd className="font-semibold capitalize">{value}</dd>
              </div>
            ))}
          </dl>

          {fitur.length > 0 ? (
            <section>
              <h2 className="mb-2 font-bold">{t.vehicle.features}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {fitur.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-lians-500" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {syarat.length > 0 ? (
            <section>
              <h2 className="mb-2 font-bold">{t.vehicle.terms}</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">
                {syarat.map((syaratItem) => (
                  <li key={syaratItem}>{syaratItem}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={localeHref(`/booking?vehicle=${vehicle.slug}`, locale)}
              aria-disabled={!tersedia}
              className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              {t.common.bookNow}
            </Link>
            <a
              href={waLink(settings.whatsappNumber, pesanWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold hover:border-lians-400"
            >
              {t.common.askWhatsApp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 7: Periksa tipe**

Run: `npx tsc --noEmit`
Expected: tidak ada error

- [ ] **Step 8: Buat sitemap dan robots**

Create `src/app/sitemap.ts`:

```ts
import type { MetadataRoute } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { SITE_URL, buildAlternates } from '@/lib/seo';
import { LOCALES, localeHref } from '@/i18n';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kendaraan = await getPublishedVehicles();

  const halaman: { path: string; lastModified: Date; priority: number }[] = [
    ...['/', '/mobil', '/travel', '/booking', '/testimoni', '/tentang', '/kontak'].map((path) => ({
      path,
      lastModified: new Date(),
      priority: path === '/' ? 1 : 0.8,
    })),
    ...kendaraan.map((v) => ({
      path: `/mobil/${v.slug}`,
      lastModified: v.updatedAt,
      priority: 0.7,
    })),
  ];

  // Setiap halaman muncul empat kali — sekali per bahasa — masing-masing
  // membawa daftar alternatifnya, sehingga Google tahu keempatnya bersaudara.
  return halaman.flatMap((h) =>
    LOCALES.map((locale) => ({
      url: `${SITE_URL}${localeHref(h.path, locale)}`,
      lastModified: h.lastModified,
      priority: h.priority,
      alternates: { languages: buildAlternates(h.path, locale).languages },
    })),
  );
}
```

Create `src/app/robots.ts`:

```ts
import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 9: Lengkapi metadata dasar dan font**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { SITE_URL } from '@/lib/seo';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'LIANS — Rental Mobil Manado, Lepas Kunci & Dengan Sopir',
    template: '%s | LIANS',
  },
  description:
    'Rental mobil lepas kunci dan dengan sopir, bus pariwisata, serta antar-jemput bandara di Manado. Jalan Pomorow, depan Luwansa Hotel.',
  keywords: ['rental mobil manado', 'sewa mobil manado', 'rental mobil lepas kunci manado', 'sewa hiace manado'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={jakarta.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 10: Verifikasi halaman detail secara manual**

Run: `npm run dev`, lalu periksa:

1. `http://localhost:3000/mobil/innova-zenix-g` → tarif 24 dan 12 jam, fasilitas berbahasa Indonesia
2. `http://localhost:3000/en/mobil/innova-zenix-g` → fasilitas berbahasa Inggris, nama mobil tetap "Innova Zenix G"
3. `curl -s localhost:3000/sitemap.xml | grep -c innova-zenix-g` → **4** (satu per bahasa)
4. `curl -s localhost:3000/en/mobil/innova-zenix-g | grep hreflang` → memuat keempat bahasa dan `x-default`

- [ ] **Step 11: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: halaman detail kendaraan, JSON-LD, sitemap, dan robots"
```

---

### Task 11: Halaman travel

**Files:**
- Create: `src/components/travel/RouteCard.tsx`, `src/app/(public)/[locale]/travel/page.tsx`
- Test: `tests/components/travel.test.tsx`

**Interfaces:**
- Consumes: `getPublishedRoutes()`, `getSettings()`, `waLink`, `formatRupiah`
- Produces: `<RouteCard route={TravelRoute} whatsappNumber={string} locale={Locale} />` dari `@/components/travel/RouteCard`

- [ ] **Step 1: Tulis tes yang gagal**

Create `tests/components/travel.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteCard } from '@/components/travel/RouteCard';
import type { TravelRoute } from '@/db/schema';

const rute = {
  id: '33333333-3333-4333-8333-333333333333',
  origin: 'Manado',
  destination: 'Bandara Sam Ratulangi',
  price: 150000,
  vehicleNote: { id: 'Avanza / Xenia' },
  estimatedDuration: { id: '30 menit' },
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as TravelRoute;

describe('RouteCard', () => {
  it('menampilkan asal dan tujuan', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByText(/Manado/)).toBeInTheDocument();
    expect(screen.getByText(/Bandara Sam Ratulangi/)).toBeInTheDocument();
  });

  it('menampilkan tarif dalam rupiah bila tersedia', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByText(/Rp 150\.000/)).toBeInTheDocument();
  });

  it('mengganti tarif dengan ajakan menghubungi bila harga belum ditetapkan', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByText(/hubungi untuk harga/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rp/)).not.toBeInTheDocument();
  });

  it('menautkan ke WhatsApp dengan pesan berisi nama rute', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" locale="id" />);
    const tautan = screen.getByRole('link', { name: /hubungi untuk harga/i });
    expect(tautan.getAttribute('href')).toContain('wa.me/6281234567890');
    expect(decodeURIComponent(tautan.getAttribute('href') ?? '')).toContain('Bandara Sam Ratulangi');
  });

  it('menautkan ke form booking bila rute sudah bertarif', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByRole('link', { name: /pesan/i })).toHaveAttribute(
      'href',
      `/booking?route=${rute.id}`,
    );
  });

  it('menampilkan waktu tempuh dalam bahasa yang diminta', () => {
    const berbahasa = {
      ...rute,
      estimatedDuration: { id: '30 menit', en: '30 minutes', ko: '30분' },
    } as unknown as TravelRoute;
    render(<RouteCard route={berbahasa} whatsappNumber="081234567890" locale="ko" />);
    expect(screen.getByText(/30분/)).toBeInTheDocument();
  });

  it('jatuh ke bahasa Indonesia bila waktu tempuh belum diterjemahkan', () => {
    const berbahasa = { ...rute, estimatedDuration: { id: '30 menit' } } as unknown as TravelRoute;
    render(<RouteCard route={berbahasa} whatsappNumber="081234567890" locale="zh" />);
    expect(screen.getByText(/30 menit/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/components/travel.test.tsx`
Expected: FAIL — komponen `RouteCard` belum ada

- [ ] **Step 3: Implementasi RouteCard**

Create `src/components/travel/RouteCard.tsx`:

```tsx
import Link from 'next/link';
import { ArrowRight, Clock, Car } from 'lucide-react';
import type { TravelRoute } from '@/db/schema';
import { formatRupiah } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

export function RouteCard({
  route,
  whatsappNumber,
  locale,
}: {
  route: TravelRoute;
  whatsappNumber: string;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const durasi = pickLocale(route.estimatedDuration, locale);
  const catatan = pickLocale(route.vehicleNote, locale);

  // Pesan WhatsApp selalu berbahasa Indonesia — yang membacanya staf LIANS.
  const pesan = `Halo LIANS, saya ingin menanyakan harga antar-jemput ${route.origin} ke ${route.destination}.`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 font-bold">
        <span>{route.origin}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
        <span>{route.destination}</span>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {durasi ? (
          <li className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {durasi}
          </li>
        ) : null}
        {catatan ? (
          <li className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" aria-hidden /> {catatan}
          </li>
        ) : null}
      </ul>

      <div className="mt-auto border-t border-slate-100 pt-4">
        {route.price !== null ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-black text-lians-600">{formatRupiah(route.price)}</p>
              <p className="text-xs text-muted">{t.travel.oneWayIncludingDriver}</p>
            </div>
            <Link
              href={localeHref(`/booking?route=${route.id}`, locale)}
              className="rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
            >
              {t.common.order}
            </Link>
          </div>
        ) : (
          <a
            href={waLink(whatsappNumber, pesan)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-lians-300 px-4 py-2 text-sm font-semibold text-lians-700 hover:bg-lians-50"
          >
            {t.common.contactForPrice}
          </a>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/travel.test.tsx`
Expected: PASS, 7 tes

- [ ] **Step 5: Buat halaman travel**

Create `src/app/(public)/[locale]/travel/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { RouteCard } from '@/components/travel/RouteCard';
import { getMessages, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Antar-Jemput Bandara & Travel Manado — LIANS',
    description:
      'Layanan antar-jemput Bandara Sam Ratulangi dan travel antar kota di Sulawesi Utara. Tarif tetap sekali jalan, sudah termasuk sopir.',
  },
  en: {
    title: 'Manado Airport Transfer & Intercity Travel — LIANS',
    description:
      'Sam Ratulangi Airport transfers and intercity travel across North Sulawesi. Fixed one-way fares, driver included.',
  },
  zh: {
    title: '万鸦老机场接送与城际包车 — LIANS',
    description: '沙姆·拉图兰吉机场接送及北苏拉威西城际包车。单程固定价，含司机。',
  },
  ko: {
    title: '마나도 공항 픽업 및 시외 이동 — LIANS',
    description: '삼 라툴랑기 공항 픽업과 북술라웨시 시외 이동. 편도 고정 요금, 기사 포함.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/travel', locale) };
}

export default async function TravelPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const [rute, settings] = await Promise.all([getPublishedRoutes(), getSettings()]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.travel.title}</h1>
        <p className="max-w-2xl text-muted">{t.travel.subtitle}</p>
      </header>

      {rute.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          {t.travel.empty}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rute.map((r) => (
            <RouteCard
              key={r.id}
              route={r}
              whatsappNumber={settings.whatsappNumber}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: halaman antar-jemput dan travel"
```

---
### Task 12: Form booking, Server Action, dan pesan WhatsApp

Tugas terbesar dan paling penting di sisi publik. Di sinilah aturan "jangan pernah percaya harga dari browser" ditegakkan.

**Files:**
- Create: `src/lib/rate-limit.ts`, `src/actions/booking.ts`, `src/components/booking/BookingForm.tsx`, `src/components/booking/PriceSummary.tsx`, `src/app/(public)/[locale]/booking/page.tsx`, `src/app/(public)/[locale]/booking/sukses/page.tsx`
- Modify: `src/lib/whatsapp.ts` (tambah `buildBookingMessage`)
- Test: `tests/unit/whatsapp.test.ts`, `tests/components/booking-form.test.tsx`

**Interfaces:**
- Consumes: `bookingInputSchema`, `calculateRentalPrice`, `calculateTravelPrice`, `generateBookingCode`, `getVehicleById`, `getRouteById`, `getSettings`, `ok`/`fail`
- Produces:
  - `buildBookingMessage(args: BookingMessageArgs): string` dari `@/lib/whatsapp`, dengan `type BookingMessageArgs = { bookingCode: string; customerName: string; itemName: string; startDate: string; endDate?: string | null; rateType?: '24h' | '12h' | null; days?: number | null; driverDays: number; totalPrice: number | null; notes?: string | null }`
  - `checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean>` dari `@/lib/rate-limit`
  - `createBooking(input: unknown): Promise<ActionResult<{ bookingCode: string; whatsappUrl: string }>>` dari `@/actions/booking`

- [ ] **Step 1: Tulis tes pesan WhatsApp yang gagal**

Create `tests/unit/whatsapp.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildBookingMessage, normalizePhone, waLink } from '@/lib/whatsapp';

describe('normalizePhone', () => {
  it('mengubah awalan 0 menjadi 62', () => {
    expect(normalizePhone('081234567890')).toBe('6281234567890');
  });

  it('membuang tanda plus dan spasi', () => {
    expect(normalizePhone('+62 812-3456-7890')).toBe('6281234567890');
  });

  it('membiarkan nomor yang sudah diawali 62', () => {
    expect(normalizePhone('6281234567890')).toBe('6281234567890');
  });
});

describe('buildBookingMessage', () => {
  const sewa = {
    bookingCode: 'LNS-20260810-A7K2',
    customerName: 'Budi Santoso',
    itemName: 'Innova Zenix G',
    startDate: '2026-08-01',
    endDate: '2026-08-06',
    rateType: '24h' as const,
    days: 5,
    driverDays: 3,
    totalPrice: 3950000,
    notes: 'Jemput di bandara',
  };

  it('menyertakan kode booking', () => {
    expect(buildBookingMessage(sewa)).toContain('LNS-20260810-A7K2');
  });

  it('menyertakan nama kendaraan dan total dalam rupiah', () => {
    const pesan = buildBookingMessage(sewa);
    expect(pesan).toContain('Innova Zenix G');
    expect(pesan).toContain('Rp 3.950.000');
  });

  it('menjelaskan jumlah hari sewa dan hari pakai sopir', () => {
    const pesan = buildBookingMessage(sewa);
    expect(pesan).toContain('5 hari');
    expect(pesan).toContain('3 hari');
  });

  it('menyertakan catatan customer bila ada', () => {
    expect(buildBookingMessage(sewa)).toContain('Jemput di bandara');
  });

  it('menyebut menunggu penawaran bila total belum ditetapkan', () => {
    const pesan = buildBookingMessage({
      bookingCode: 'LNS-20260810-B3M9',
      customerName: 'Sari',
      itemName: 'Manado → Likupang',
      startDate: '2026-08-01',
      driverDays: 0,
      totalPrice: null,
    });
    expect(pesan).toMatch(/menunggu penawaran harga/i);
    expect(pesan).not.toContain('Rp');
  });

  it('tidak menyebut sopir bila hari sopir nol', () => {
    const pesan = buildBookingMessage({ ...sewa, driverDays: 0 });
    expect(pesan).not.toMatch(/sopir/i);
  });
});

describe('waLink', () => {
  it('menyandikan pesan ke dalam URL', () => {
    const url = waLink('081234567890', 'Halo LIANS & terima kasih');
    expect(url).toContain('wa.me/6281234567890?text=');
    expect(decodeURIComponent(url)).toContain('Halo LIANS & terima kasih');
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/whatsapp.test.ts`
Expected: FAIL — `buildBookingMessage` belum diekspor

- [ ] **Step 3: Implementasi penyusun pesan**

Tambahkan ke `src/lib/whatsapp.ts`:

```ts
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';

export type BookingMessageArgs = {
  bookingCode: string;
  customerName: string;
  itemName: string;
  startDate: string;
  endDate?: string | null;
  rateType?: '24h' | '12h' | null;
  days?: number | null;
  driverDays: number;
  totalPrice: number | null;
  notes?: string | null;
};

/**
 * Pesan WhatsApp selalu berbahasa Indonesia, apa pun bahasa yang dipakai customer.
 * Yang membaca pesan ini staf LIANS di Manado — menerjemahkannya ke bahasa
 * customer justru membuat staf harus menebak isi pesanannya sendiri.
 */
export function buildBookingMessage(a: BookingMessageArgs): string {
  const baris: string[] = [
    `Halo LIANS, saya ingin konfirmasi pesanan.`,
    ``,
    `Kode: ${a.bookingCode}`,
    `Nama: ${a.customerName}`,
    `Pesanan: ${a.itemName}`,
    `Mulai: ${formatTanggal(new Date(a.startDate), 'id')}`,
  ];

  if (a.endDate) baris.push(`Selesai: ${formatTanggal(new Date(a.endDate), 'id')}`);
  if (a.days) baris.push(`Durasi: ${a.days} hari (paket ${a.rateType === '12h' ? '12' : '24'} jam)`);
  if (a.driverDays > 0) baris.push(`Pakai sopir: ${a.driverDays} hari`);
  if (a.notes) baris.push(`Catatan: ${a.notes}`);

  baris.push(``);
  baris.push(
    a.totalPrice === null
      ? `Total: menunggu penawaran harga dari LIANS`
      : `Total: ${formatRupiah(a.totalPrice)}`,
  );

  return baris.join('\n');
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/whatsapp.test.ts`
Expected: PASS, 10 tes

- [ ] **Step 5: Implementasi pembatas laju**

Create `src/lib/rate-limit.ts`:

```ts
import { sql } from 'drizzle-orm';
import { db } from '@/db';
import { rateLimits } from '@/db/schema';

/**
 * Jendela tetap sederhana yang disimpan di Postgres.
 * Mengembalikan true bila permintaan masih dalam batas.
 *
 * Dipilih di atas penghitung dalam memori karena fungsi serverless
 * tidak berbagi memori antar-invokasi — penghitung dalam memori
 * praktis tidak membatasi apa pun di Vercel.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  const [row] = await db
    .insert(rateLimits)
    .values({ key, count: 1, windowStart: new Date() })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`CASE
          WHEN ${rateLimits.windowStart} < NOW() - (${windowMs} || ' milliseconds')::interval
          THEN 1
          ELSE ${rateLimits.count} + 1
        END`,
        windowStart: sql`CASE
          WHEN ${rateLimits.windowStart} < NOW() - (${windowMs} || ' milliseconds')::interval
          THEN NOW()
          ELSE ${rateLimits.windowStart}
        END`,
      },
    })
    .returning();

  return (row?.count ?? 1) <= limit;
}
```

- [ ] **Step 6: Implementasi Server Action createBooking**

Create `src/actions/booking.ts`:

```ts
'use server';

import { headers } from 'next/headers';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { bookingInputSchema } from '@/schemas/booking';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import { generateBookingCode } from '@/lib/booking-code';
import { buildBookingMessage, waLink } from '@/lib/whatsapp';
import { checkRateLimit } from '@/lib/rate-limit';
import { getVehicleById } from '@/queries/vehicles';
import { getRouteById } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { fail, ok, type ActionResult } from './result';

const PESAN_KESALAHAN: Record<string, string> = {
  RATE_12H_UNAVAILABLE: 'Kendaraan ini tidak menyediakan paket 12 jam.',
  DRIVER_DAYS_EXCEEDS_DURATION: 'Hari pakai sopir tidak boleh melebihi durasi sewa.',
  DRIVER_DAYS_NEGATIVE: 'Hari pakai sopir tidak boleh negatif.',
};

export async function createBooking(
  input: unknown,
): Promise<ActionResult<{ bookingCode: string; whatsappUrl: string }>> {
  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'tanpa-ip';
  const lolos = await checkRateLimit(`booking:${ip}`, 5, 60 * 60 * 1000);
  if (!lolos) {
    return fail('Terlalu banyak pesanan dari perangkat ini. Silakan hubungi kami lewat WhatsApp.');
  }

  const parsed = bookingInputSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    return fail('Periksa kembali isian Anda.', fieldErrors);
  }
  const data = parsed.data;
  const settings = await getSettings();

  let totalPrice: number | null;
  let priceBreakdown = null;
  let itemName: string;
  let days: number | null = null;

  if (data.serviceType === 'travel') {
    const route = await getRouteById(data.routeId);
    if (!route || !route.isPublished) return fail('Rute tidak ditemukan.');
    itemName = `${route.origin} → ${route.destination}`;
    totalPrice = calculateTravelPrice(route.price);
  } else {
    const vehicle = await getVehicleById(data.vehicleId);
    if (!vehicle || !vehicle.isPublished) return fail('Kendaraan tidak ditemukan.');
    if (vehicle.status !== 'available') {
      return fail('Kendaraan ini sedang tersewa. Silakan pilih kendaraan lain atau hubungi kami.');
    }

    // Harga selalu dihitung ulang dari tarif di database — nilai dari browser diabaikan.
    const hasil = calculateRentalPrice({
      vehicle: {
        rate24h: vehicle.rate24h,
        rate12h: vehicle.rate12h,
        driverFeeOverride: vehicle.driverFeeOverride,
      },
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      rateType: data.rateType,
      driverDays: data.driverDays,
      driverFeePerDay: settings.driverFeePerDay,
    });

    if (!hasil.ok) return fail(PESAN_KESALAHAN[hasil.error] ?? 'Perhitungan harga gagal.');

    itemName = vehicle.name;
    totalPrice = hasil.breakdown.total;
    priceBreakdown = hasil.breakdown;
    days = hasil.breakdown.days;
  }

  const bookingCode = generateBookingCode(new Date());

  await db.insert(bookings).values({
    bookingCode,
    customerName: data.customerName,
    phone: data.phone,
    email: data.email || null,
    serviceType: data.serviceType,
    vehicleId: data.serviceType === 'travel' ? null : data.vehicleId,
    routeId: data.serviceType === 'travel' ? data.routeId : null,
    vehicleNameSnapshot: data.serviceType === 'travel' ? null : itemName,
    routeNameSnapshot: data.serviceType === 'travel' ? itemName : null,
    startDate: data.startDate,
    endDate: data.serviceType === 'travel' ? null : data.endDate,
    rateType: data.serviceType === 'travel' ? null : data.rateType,
    driverDays: data.driverDays,
    totalPrice,
    priceBreakdown,
    notes: data.notes || null,
    status: 'pending',
  });

  const pesan = buildBookingMessage({
    bookingCode,
    customerName: data.customerName,
    itemName,
    startDate: data.startDate,
    endDate: data.serviceType === 'travel' ? null : data.endDate,
    rateType: data.serviceType === 'travel' ? null : data.rateType,
    days,
    driverDays: data.driverDays,
    totalPrice,
    notes: data.notes,
  });

  return ok({ bookingCode, whatsappUrl: waLink(settings.whatsappNumber, pesan) });
}
```

- [ ] **Step 7: Buat ringkasan harga**

Create `src/components/booking/PriceSummary.tsx`:

```tsx
import { formatRupiah } from '@/lib/format';
import type { PriceBreakdown } from '@/lib/pricing';
import { getMessages, fill, type Locale } from '@/i18n';

export function PriceSummary({
  breakdown,
  pesan,
  locale,
}: {
  breakdown: PriceBreakdown | null;
  pesan?: string;
  locale: Locale;
}) {
  const t = getMessages(locale);

  if (!breakdown) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-muted">
        {pesan ?? t.booking.estimateHint}
      </div>
    );
  }

  const baris = [
    {
      label: fill(t.booking.rentalLine, {
        days: breakdown.days,
        harga: formatRupiah(breakdown.ratePerDay),
      }),
      nilai: breakdown.rentalCost,
    },
    ...(breakdown.driverDays > 0
      ? [{
          label: fill(t.booking.driverLine, {
            days: breakdown.driverDays,
            harga: formatRupiah(breakdown.driverFeePerDay),
          }),
          nilai: breakdown.driverCost,
        }]
      : []),
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-lians-200 bg-lians-50 p-5">
      <h2 className="font-bold">{t.booking.estimate}</h2>
      <dl className="space-y-2 text-sm">
        {baris.map((b) => (
          <div key={b.label} className="flex justify-between gap-3">
            <dt className="text-slate-600">{b.label}</dt>
            <dd className="font-medium">{formatRupiah(b.nilai)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between border-t border-lians-200 pt-3">
        <span className="font-bold">{t.booking.total}</span>
        <span className="text-xl font-black text-lians-700">{formatRupiah(breakdown.total)}</span>
      </div>
      <p className="text-xs text-muted">{t.booking.excludesNote}</p>
    </div>
  );
}
```

- [ ] **Step 8: Tulis tes form booking yang gagal**

Create `tests/components/booking-form.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '@/components/booking/BookingForm';

const kendaraan = [
  { id: '11111111-1111-4111-8111-111111111111', slug: 'innova-zenix-g', name: 'Innova Zenix G', rate24h: 900000, rate12h: 650000, driverFeeOverride: null, status: 'available' as const },
  { id: '22222222-2222-4222-8222-222222222222', slug: 'all-new-brio', name: 'All New Brio', rate24h: 350000, rate12h: null, driverFeeOverride: null, status: 'available' as const },
];

const rute = [
  { id: '33333333-3333-4333-8333-333333333333', label: 'Manado → Bandara Sam Ratulangi', price: 150000 },
];

const render1 = (onSubmit = vi.fn()) =>
  render(
    <BookingForm
      vehicles={kendaraan}
      routes={rute}
      driverFeePerDay={150000}
      defaultVehicleSlug={null}
      defaultRouteId={null}
      onSubmit={onSubmit}
      locale="id"
    />,
  );

describe('BookingForm', () => {
  it('menampilkan perkiraan harga setelah kendaraan dan tanggal diisi', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-06');

    expect(await screen.findByText(/Rp 4\.500\.000/)).toBeInTheDocument();
  });

  it('menambahkan biaya sopir sesuai hari yang dipilih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-06');
    await user.clear(screen.getByLabelText(/hari pakai sopir/i));
    await user.type(screen.getByLabelText(/hari pakai sopir/i), '3');

    expect(await screen.findByText(/Rp 4\.950\.000/)).toBeInTheDocument();
  });

  it('menyembunyikan pilihan paket 12 jam untuk kendaraan yang tidak menyediakannya', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[1].id);
    expect(screen.queryByRole('radio', { name: /12 jam/i })).not.toBeInTheDocument();
  });

  it('memperingatkan bila hari sopir melebihi durasi sewa', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-03');
    await user.clear(screen.getByLabelText(/hari pakai sopir/i));
    await user.type(screen.getByLabelText(/hari pakai sopir/i), '9');

    expect(await screen.findByText(/tidak boleh lebih dari 2 hari/i)).toBeInTheDocument();
  });

  it('mengganti isian kendaraan dengan pilihan rute saat layanan travel dipilih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/jenis layanan/i), 'travel');
    expect(screen.getByLabelText(/rute/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/tanggal selesai/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 9: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/components/booking-form.test.tsx`
Expected: FAIL — komponen `BookingForm` belum ada

- [ ] **Step 10: Implementasi BookingForm**

Create `src/components/booking/BookingForm.tsx`:

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { calculateRentalPrice, type PriceBreakdown, type RateType } from '@/lib/pricing';
import { formatRupiah } from '@/lib/format';
import { getMessages, fill, localeHref, type Locale } from '@/i18n';
import { PriceSummary } from './PriceSummary';

export type BookingVehicleOption = {
  id: string;
  slug: string;
  name: string;
  rate24h: number;
  rate12h: number | null;
  driverFeeOverride: number | null;
  status: 'available' | 'unavailable';
};

export type BookingRouteOption = { id: string; label: string; price: number | null };

type FormValues = {
  serviceType: 'self-drive' | 'with-driver' | 'tourism' | 'travel';
  vehicleId: string;
  routeId: string;
  startDate: string;
  endDate: string;
  rateType: RateType;
  driverDays: number;
  customerName: string;
  phone: string;
  email: string;
  notes: string;
};

type SubmitFn = (input: unknown) => Promise<
  { ok: true; data: { bookingCode: string; whatsappUrl: string } } | { ok: false; message: string; fieldErrors?: Record<string, string[]> }
>;

const kelasInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lians-500 focus:outline-none focus:ring-2 focus:ring-lians-200';

export function BookingForm({
  vehicles,
  routes,
  driverFeePerDay,
  defaultVehicleSlug,
  defaultRouteId,
  onSubmit,
  locale,
}: {
  vehicles: BookingVehicleOption[];
  routes: BookingRouteOption[];
  driverFeePerDay: number;
  defaultVehicleSlug: string | null;
  defaultRouteId: string | null;
  onSubmit: SubmitFn;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const [mengirim, setMengirim] = useState(false);

  const { register, watch, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: {
      serviceType: defaultRouteId ? 'travel' : 'self-drive',
      vehicleId: vehicles.find((v) => v.slug === defaultVehicleSlug)?.id ?? '',
      routeId: defaultRouteId ?? '',
      startDate: '',
      endDate: '',
      rateType: '24h',
      driverDays: 0,
      customerName: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  const nilai = watch();
  const adalahTravel = nilai.serviceType === 'travel';
  const kendaraanTerpilih = vehicles.find((v) => v.id === nilai.vehicleId) ?? null;
  const rutePilihan = routes.find((r) => r.id === nilai.routeId) ?? null;

  const { breakdown, pesanHarga } = useMemo((): {
    breakdown: PriceBreakdown | null;
    pesanHarga?: string;
  } => {
    if (adalahTravel) {
      return {
        breakdown: null,
        pesanHarga: rutePilihan
          ? rutePilihan.price === null
            ? t.booking.routeNoPrice
            : fill(t.booking.routeFixedPrice, { harga: formatRupiah(rutePilihan.price) })
          : undefined,
      };
    }
    if (!kendaraanTerpilih || !nilai.startDate || !nilai.endDate) return { breakdown: null };

    const hasil = calculateRentalPrice({
      vehicle: {
        rate24h: kendaraanTerpilih.rate24h,
        rate12h: kendaraanTerpilih.rate12h,
        driverFeeOverride: kendaraanTerpilih.driverFeeOverride,
      },
      startDate: new Date(nilai.startDate),
      endDate: new Date(nilai.endDate),
      rateType: nilai.rateType,
      driverDays: Number(nilai.driverDays) || 0,
      driverFeePerDay,
    });

    if (hasil.ok) return { breakdown: hasil.breakdown };

    return { breakdown: null, pesanHarga: t.pricingError[hasil.error] };
  }, [adalahTravel, rutePilihan, kendaraanTerpilih, nilai.startDate, nilai.endDate, nilai.rateType, nilai.driverDays, driverFeePerDay, t]);

  const jumlahHari = breakdown?.days ?? null;
  const sopirBerlebih =
    !adalahTravel && jumlahHari !== null && Number(nilai.driverDays) > jumlahHari;

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const payload = adalahTravel
      ? {
          serviceType: 'travel',
          routeId: v.routeId,
          startDate: v.startDate,
          driverDays: 0,
          customerName: v.customerName,
          phone: v.phone,
          email: v.email,
          notes: v.notes,
        }
      : {
          serviceType: v.serviceType,
          vehicleId: v.vehicleId,
          startDate: v.startDate,
          endDate: v.endDate,
          rateType: v.rateType,
          driverDays: Number(v.driverDays) || 0,
          customerName: v.customerName,
          phone: v.phone,
          email: v.email,
          notes: v.notes,
        };

    const hasil = await onSubmit(payload);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    window.location.href = localeHref(
      `/booking/sukses?kode=${hasil.data.bookingCode}&wa=${encodeURIComponent(hasil.data.whatsappUrl)}`,
      locale,
    );
  });

  return (
    <form onSubmit={kirim} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.serviceType}</span>
          <select {...register('serviceType')} className={kelasInput}>
            <option value="self-drive">{t.booking.selfDrive}</option>
            <option value="with-driver">{t.booking.withDriver}</option>
            <option value="tourism">{t.booking.tourism}</option>
            <option value="travel">{t.booking.travelService}</option>
          </select>
        </label>

        {adalahTravel ? (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.route}</span>
            <select {...register('routeId', { required: true })} className={kelasInput}>
              <option value="">{t.booking.chooseRoute}</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                  {r.price === null ? ` — ${t.common.contactForPrice}` : ` — ${formatRupiah(r.price)}`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.vehicle}</span>
            <select {...register('vehicleId', { required: true })} className={kelasInput}>
              <option value="">{t.booking.chooseVehicle}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.status !== 'available'}>
                  {v.name} — {formatRupiah(v.rate24h)} / {t.common.perDay24}
                  {v.status !== 'available' ? ` (${t.common.unavailable})` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.startDate}</span>
            <input type="date" {...register('startDate', { required: true })} className={kelasInput} />
          </label>

          {!adalahTravel ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t.booking.endDate}</span>
              <input type="date" {...register('endDate', { required: true })} className={kelasInput} />
            </label>
          ) : null}
        </div>

        {!adalahTravel && kendaraanTerpilih?.rate12h !== null && kendaraanTerpilih ? (
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">{t.booking.ratePackage}</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="24h" {...register('rateType')} /> {t.common.perDay24} (
                {formatRupiah(kendaraanTerpilih.rate24h)})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="12h" {...register('rateType')} /> {t.common.perDay12} (
                {formatRupiah(kendaraanTerpilih.rate12h)})
              </label>
            </div>
          </fieldset>
        ) : null}

        {!adalahTravel ? (
          <label className="block max-w-xs">
            <span className="mb-1 block text-sm font-semibold">{t.booking.driverDays}</span>
            <input
              type="number"
              min={0}
              max={jumlahHari ?? undefined}
              {...register('driverDays', { valueAsNumber: true })}
              className={kelasInput}
            />
            <span className="mt-1 block text-xs text-muted">
              {t.booking.driverDaysHint}
              {jumlahHari !== null ? ` ${fill(t.booking.driverDaysMax, { n: jumlahHari })}` : ''}
            </span>
            {sopirBerlebih ? (
              <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
                {fill(t.booking.driverDaysTooMany, { n: jumlahHari })}
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.fullName}</span>
            <input {...register('customerName', { required: true })} className={kelasInput} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.whatsappNumber}</span>
            <input {...register('phone', { required: true })} placeholder="081234567890" className={kelasInput} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.emailOptional}</span>
          <input type="email" {...register('email')} className={kelasInput} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.notesOptional}</span>
          <textarea rows={3} {...register('notes')} placeholder={t.booking.notesPlaceholder} className={kelasInput} />
        </label>

        <button
          type="submit"
          disabled={mengirim || sopirBerlebih || formState.isSubmitting}
          className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
        >
          {mengirim ? t.booking.submitting : t.booking.submit}
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PriceSummary breakdown={breakdown} pesan={pesanHarga} locale={locale} />
      </aside>
    </form>
  );
}
```

- [ ] **Step 11: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/booking-form.test.tsx`
Expected: PASS, 5 tes

- [ ] **Step 12: Buat halaman booking dan halaman sukses**

Create `src/app/(public)/[locale]/booking/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { BookingForm } from '@/components/booking/BookingForm';
import { createBooking } from '@/actions/booking';
import { getMessages, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: { title: 'Booking Rental Mobil — LIANS Manado', description: 'Isi formulir pemesanan rental mobil LIANS. Konfirmasi cepat lewat WhatsApp.' },
  en: { title: 'Book a Car Rental — LIANS Manado', description: 'Fill in the LIANS booking form. Fast confirmation via WhatsApp.' },
  zh: { title: '在线预订租车 — 万鸦老 LIANS', description: '填写 LIANS 预订表单，我们将通过 WhatsApp 快速确认。' },
  ko: { title: '렌터카 예약 — 마나도 LIANS', description: 'LIANS 예약 양식을 작성하세요. WhatsApp으로 빠르게 확인해 드립니다.' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/booking', locale) };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ vehicle?: string; route?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = getMessages(locale);
  const [vehicles, routes, settings] = await Promise.all([
    getPublishedVehicles(),
    getPublishedRoutes(),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.booking.title}</h1>
        <p className="max-w-2xl text-muted">{t.booking.subtitle}</p>
      </header>

      <BookingForm
        vehicles={vehicles.map((v) => ({
          id: v.id,
          slug: v.slug,
          name: v.name,
          rate24h: v.rate24h,
          rate12h: v.rate12h,
          driverFeeOverride: v.driverFeeOverride,
          status: v.status,
        }))}
        routes={routes.map((r) => ({
          id: r.id,
          label: `${r.origin} → ${r.destination}`,
          price: r.price,
        }))}
        driverFeePerDay={settings.driverFeePerDay}
        defaultVehicleSlug={sp.vehicle ?? null}
        defaultRouteId={sp.route ?? null}
        onSubmit={createBooking}
        locale={locale}
      />
    </div>
  );
}
```

Create `src/app/(public)/[locale]/booking/sukses/page.tsx`:

```tsx
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getMessages, fill, localeHref, type Locale } from '@/i18n';

export const metadata = { title: 'LIANS', robots: { index: false } };

export default async function SuksesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ kode?: string; wa?: string }>;
}) {
  const [{ locale }, { kode, wa }] = await Promise.all([params, searchParams]);
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden />
      <h1 className="mt-4 text-2xl font-black">{t.booking.successTitle}</h1>
      <p className="mt-2 text-muted">{fill(t.booking.successBody, { kode: kode ?? '-' })}</p>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
        >
          {t.booking.continueWhatsApp}
        </a>
      ) : null}

      <p className="mt-8 text-sm text-muted">{t.booking.successFooter}</p>

      <Link
        href={localeHref('/mobil', locale)}
        className="mt-4 inline-block text-sm font-semibold text-lians-600"
      >
        {t.booking.seeOtherVehicles}
      </Link>
    </div>
  );
}
```

- [ ] **Step 13: Verifikasi alur booking secara manual**

Run: `npm run dev`, buka `http://localhost:3000/booking?vehicle=innova-zenix-g`, isi 5 hari dengan sopir 3 hari, lalu kirim.
Expected: halaman sukses menampilkan kode `LNS-…`, dan baris baru muncul di tabel `bookings` dengan `total_price` sesuai `5 × 900000 + 3 × 150000 = 4.950.000`.

Ulangi dari `http://localhost:3000/ko/booking?vehicle=innova-zenix-g`.
Expected: formulir berbahasa Korea, halaman sukses berbahasa Korea, tetapi **pesan WhatsApp yang terbuka tetap berbahasa Indonesia** — itu untuk staf, bukan untuk customer.

- [ ] **Step 14: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: form booking, Server Action, pembatas laju, dan pesan WhatsApp"
```

---
### Task 13: Beranda, testimoni, tentang, dan kontak

**Files:**
- Create: `src/components/testimonial/TestimonialCard.tsx`, `src/components/home/Hero.tsx`, `src/components/home/ServiceCards.tsx`, `src/app/(public)/[locale]/testimoni/page.tsx`, `src/app/(public)/[locale]/tentang/page.tsx`, `src/app/(public)/[locale]/kontak/page.tsx`
- Modify: `src/app/(public)/[locale]/page.tsx` (beranda penuh)
- Test: `tests/components/testimonial.test.tsx`

**Interfaces:**
- Consumes: `getFeaturedVehicles`, `getPublishedRoutes`, `getFeaturedTestimonials`, `getPublishedTestimonials`, `getSettings`, `buildAutoRentalJsonLd`, `formatRupiah`
- Produces: `<TestimonialCard testimonial={Testimonial} locale={Locale} />` dari `@/components/testimonial/TestimonialCard`

- [ ] **Step 1: Tulis tes testimoni yang gagal**

Create `tests/components/testimonial.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import type { Testimonial } from '@/db/schema';

const testimoni = {
  id: '44444444-4444-4444-8444-444444444444',
  customerName: 'Rina M.',
  rating: 5,
  reviewText: { id: 'Mobil bersih dan tepat waktu.', en: 'Clean car and on time.' },
  vehicleName: 'Innova Reborn',
  date: '2026-06-12',
  isFeatured: true,
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Testimonial;

describe('TestimonialCard', () => {
  it('menampilkan nama, ulasan, dan kendaraan', () => {
    render(<TestimonialCard testimonial={testimoni} locale="id" />);
    expect(screen.getByText('Rina M.')).toBeInTheDocument();
    expect(screen.getByText(/Mobil bersih/)).toBeInTheDocument();
    expect(screen.getByText(/Innova Reborn/)).toBeInTheDocument();
  });

  it('menyatakan rating sebagai teks yang bisa dibaca pembaca layar', () => {
    render(<TestimonialCard testimonial={testimoni} locale="id" />);
    expect(screen.getByLabelText('Rating 5 dari 5')).toBeInTheDocument();
  });

  it('menampilkan tanggal dalam format Indonesia', () => {
    render(<TestimonialCard testimonial={testimoni} locale="id" />);
    expect(screen.getByText('12 Juni 2026')).toBeInTheDocument();
  });

  it('menampilkan ulasan dan tanggal sesuai bahasa yang diminta', () => {
    render(<TestimonialCard testimonial={testimoni} locale="en" />);
    expect(screen.getByText(/Clean car and on time/)).toBeInTheDocument();
    expect(screen.getByText('12 June 2026')).toBeInTheDocument();
  });

  it('jatuh ke ulasan bahasa Indonesia bila terjemahan belum ada', () => {
    render(<TestimonialCard testimonial={testimoni} locale="ko" />);
    expect(screen.getByText(/Mobil bersih/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/components/testimonial.test.tsx`
Expected: FAIL — komponen belum ada

- [ ] **Step 3: Implementasi TestimonialCard**

Create `src/components/testimonial/TestimonialCard.tsx`:

```tsx
import { Star } from 'lucide-react';
import type { Testimonial } from '@/db/schema';
import { formatTanggal } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { getMessages, fill, pickLocale, type Locale } from '@/i18n';

export function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: Testimonial;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const ulasan = pickLocale(testimonial.reviewText, locale) ?? '';

  return (
    <figure className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div
        role="img"
        aria-label={fill(t.testimonials.ratingLabel, { n: testimonial.rating })}
        className="flex gap-0.5"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={cn(
              'h-4 w-4',
              i <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
            )}
          />
        ))}
      </div>

      <blockquote className="flex-1 text-sm leading-relaxed text-slate-700">“{ulasan}”</blockquote>

      <figcaption className="border-t border-slate-100 pt-3 text-sm">
        <span className="font-semibold">{testimonial.customerName}</span>
        {testimonial.vehicleName ? (
          <span className="block text-xs text-muted">{testimonial.vehicleName}</span>
        ) : null}
        <span className="block text-xs text-muted">
          {formatTanggal(new Date(testimonial.date), locale)}
        </span>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/testimonial.test.tsx`
Expected: PASS, 5 tes

- [ ] **Step 5: Buat hero dan kartu layanan**

Create `src/components/home/Hero.tsx`:

```tsx
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function Hero({
  title,
  subtitle,
  locale,
}: {
  title: string;
  subtitle: string;
  locale: Locale;
}) {
  const t = getMessages(locale);

  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-lians-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-lians-700 shadow-sm">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {t.home.servingArea}
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">{subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={localeHref('/mobil', locale)} className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600">
            {t.home.viewFleet}
          </Link>
          <Link href={localeHref('/booking', locale)} className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold hover:border-lians-400">
            {t.common.bookNow}
          </Link>
        </div>
      </div>
    </section>
  );
}
```

Create `src/components/home/ServiceCards.tsx`:

```tsx
import Link from 'next/link';
import { Key, UserRound, Bus, PlaneTakeoff } from 'lucide-react';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function ServiceCards({ locale }: { locale: Locale }) {
  const t = getMessages(locale);

  const LAYANAN = [
    { Icon: Key, title: t.home.serviceSelfDrive, desc: t.home.serviceSelfDriveDesc, href: '/mobil' },
    { Icon: UserRound, title: t.home.serviceWithDriver, desc: t.home.serviceWithDriverDesc, href: '/booking' },
    { Icon: Bus, title: t.home.serviceTourism, desc: t.home.serviceTourismDesc, href: '/mobil?category=bus' },
    { Icon: PlaneTakeoff, title: t.home.serviceAirport, desc: t.home.serviceAirportDesc, href: '/travel' },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-black sm:text-3xl">{t.home.ourServices}</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {LAYANAN.map(({ Icon, title, desc, href }) => (
          <Link
            key={title}
            href={localeHref(href, locale)}
            className="rounded-2xl border border-slate-200 p-6 transition-colors hover:border-lians-300 hover:bg-lians-50"
          >
            <Icon className="h-8 w-8 text-lians-500" aria-hidden />
            <h3 className="mt-4 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Rakit beranda**

Replace `src/app/(public)/[locale]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturedVehicles } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getFeaturedTestimonials } from '@/queries/testimonials';
import { getSettings } from '@/queries/settings';
import { Hero } from '@/components/home/Hero';
import { ServiceCards } from '@/components/home/ServiceCards';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { RouteCard } from '@/components/travel/RouteCard';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import { buildAutoRentalJsonLd, buildAlternates, SITE_URL } from '@/lib/seo';
import { formatRupiah } from '@/lib/format';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSettings();
  return {
    title: pickLocale(settings.heroTitle, locale) ?? 'LIANS',
    description: pickLocale(settings.heroSubtitle, locale) ?? '',
    alternates: buildAlternates('/', locale),
  };
}

export default async function BerandaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const [kendaraan, rute, testimoni, settings] = await Promise.all([
    getFeaturedVehicles(6),
    getPublishedRoutes(),
    getFeaturedTestimonials(3),
    getSettings(),
  ]);

  const tarif = kendaraan.map((v) => v.rate24h);
  const priceRange =
    tarif.length > 0
      ? `${formatRupiah(Math.min(...tarif))} - ${formatRupiah(Math.max(...tarif))}`
      : 'Hubungi kami';

  const jsonLd = buildAutoRentalJsonLd({
    settings,
    priceRange,
    url: `${SITE_URL}${localeHref('/', locale)}`,
    locale,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Hero
        title={pickLocale(settings.heroTitle, locale) ?? ''}
        subtitle={pickLocale(settings.heroSubtitle, locale) ?? ''}
        locale={locale}
      />

      {pickLocale(settings.promoBanner, locale) ? (
        <p className="bg-lians-600 px-4 py-3 text-center text-sm font-semibold text-white">
          {pickLocale(settings.promoBanner, locale)}
        </p>
      ) : null}

      <ServiceCards locale={locale} />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black sm:text-3xl">{t.home.featuredFleet}</h2>
          <Link href={localeHref('/mobil', locale)} className="text-sm font-semibold text-lians-600">
            {t.common.viewAll} →
          </Link>
        </div>
        <VehicleGrid vehicles={kendaraan} locale={locale} />
      </section>

      {rute.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black sm:text-3xl">{t.home.popularRoutes}</h2>
            <Link href={localeHref('/travel', locale)} className="text-sm font-semibold text-lians-600">
              {t.common.viewAll} →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rute.slice(0, 3).map((r) => (
              <RouteCard
                key={r.id}
                route={r}
                whatsappNumber={settings.whatsappNumber}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}

      {testimoni.length > 0 ? (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black sm:text-3xl">
              {t.home.whatCustomersSay}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimoni.map((item) => (
                <TestimonialCard key={item.id} testimonial={item} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
```

- [ ] **Step 7: Buat halaman testimoni, tentang, dan kontak**

Create `src/app/(public)/[locale]/testimoni/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedTestimonials } from '@/queries/testimonials';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import { getMessages, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: { title: 'Testimoni Pelanggan — LIANS Manado', description: 'Pengalaman pelanggan yang telah menyewa mobil di LIANS Manado.' },
  en: { title: 'Customer Reviews — LIANS Manado', description: 'What customers say after renting with LIANS in Manado.' },
  zh: { title: '客户评价 — 万鸦老 LIANS', description: '在万鸦老 LIANS 租车的客户真实评价。' },
  ko: { title: '고객 후기 — 마나도 LIANS', description: '마나도 LIANS에서 렌트한 고객들의 후기입니다.' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/testimoni', locale) };
}

export default async function TestimoniPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const semua = await getPublishedTestimonials();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.testimonials.title}</h1>
        <p className="max-w-2xl text-muted">{t.testimonials.subtitle}</p>
      </header>

      {semua.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          {t.testimonials.empty}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {semua.map((item) => (
            <TestimonialCard key={item.id} testimonial={item} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `src/app/(public)/[locale]/tentang/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getSettings } from '@/queries/settings';
import { getMessages, fill, pickLocale, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: { title: 'Tentang LIANS — Rental Mobil Manado', description: 'Profil LIANS, penyedia rental mobil dan antar-jemput di Manado, Sulawesi Utara.' },
  en: { title: 'About LIANS — Car Rental in Manado', description: 'About LIANS, a car rental and airport transfer provider in Manado, North Sulawesi.' },
  zh: { title: '关于 LIANS — 万鸦老租车', description: '关于 LIANS：北苏拉威西万鸦老的租车与机场接送服务商。' },
  ko: { title: 'LIANS 소개 — 마나도 렌터카', description: '북술라웨시 마나도의 렌터카 및 공항 픽업 업체 LIANS 소개.' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/tentang', locale) };
}

export default async function TentangPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const settings = await getSettings();
  const teks = pickLocale(settings.aboutText, locale);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-black sm:text-4xl">{t.about.title}</h1>

      {teks ? (
        teks.split('\n\n').map((paragraf, i) => (
          <p key={i} className="leading-relaxed text-slate-700">
            {paragraf}
          </p>
        ))
      ) : (
        <p className="leading-relaxed text-slate-700">
          {fill(t.about.fallback, { alamat: settings.address })}
        </p>
      )}
    </div>
  );
}
```

Create `src/app/(public)/[locale]/kontak/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { getSettings } from '@/queries/settings';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: { title: 'Kontak LIANS — Jalan Pomorow, Manado', description: 'Hubungi LIANS di Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125.' },
  en: { title: 'Contact LIANS — Jalan Pomorow, Manado', description: 'Reach LIANS at Jalan Pomorow (in front of Luwansa Hotel), Banjer, Tikala, Manado 95125.' },
  zh: { title: '联系 LIANS — 万鸦老 Pomorow 路', description: '联系 LIANS：万鸦老 Tikala 区 Banjer Pomorow 路（Luwansa 酒店对面），邮编 95125。' },
  ko: { title: 'LIANS 문의 — 마나도 Pomorow 거리', description: '마나도 티칼라 반저르 포모로우 거리(루완사 호텔 앞) LIANS로 문의하세요. 우편번호 95125.' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/kontak', locale) };
}

export default async function KontakPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const settings = await getSettings();
  const petaSrc = `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black sm:text-4xl">{t.contact.title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <ul className="space-y-5">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.address}</p>
              <p className="text-sm text-muted">{settings.address}</p>
            </div>
          </li>
          <li className="flex gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.whatsapp}</p>
              <a
                href={waLink(settings.whatsappNumber, 'Halo LIANS, saya ingin bertanya.')}
                className="text-sm text-lians-600"
              >
                {settings.whatsappNumber}
              </a>
            </div>
          </li>
          <li className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.phone}</p>
              <a href={`tel:${settings.phone}`} className="text-sm text-lians-600">
                {settings.phone}
              </a>
            </div>
          </li>
          {settings.email ? (
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
              <div>
                <p className="font-semibold">{t.contact.email}</p>
                <a href={`mailto:${settings.email}`} className="text-sm text-lians-600">
                  {settings.email}
                </a>
              </div>
            </li>
          ) : null}
          <li className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.hours}</p>
              <p className="text-sm text-muted">{pickLocale(settings.operatingHours, locale)}</p>
            </div>
          </li>
        </ul>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <iframe
            title={t.contact.mapTitle}
            src={settings.mapsUrl || petaSrc}
            className="h-80 w-full lg:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: beranda, testimoni, tentang, dan kontak"
```

---

## Fase 3 — Panel Admin

### Task 14: Autentikasi dan halaman login

**Catatan penyimpangan dari spesifikasi.** Spesifikasi menyebut panel admin dijaga middleware Auth.js. Rencana ini menaruh penjaga sesi di layout admin, bukan di proxy, karena `bcryptjs` tidak dapat berjalan di Edge Runtime tempat proxy Next.js dieksekusi. Proxy tetap menangani penulisan-ulang hostname. Lapisan keamanannya menjadi: layout admin memeriksa sesi, dan setiap Server Action admin memeriksa sesinya sendiri — sehingga permintaan langsung ke action tetap tertolak walau seseorang melewati halaman.

**Files:**
- Create: `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/actions/auth-guard.ts`, `src/app/(admin)/admin/layout.tsx`, `src/app/(admin)/admin/login/page.tsx`, `src/components/admin/LoginForm.tsx`, `src/components/admin/AdminNav.tsx`, `src/app/(admin)/admin/error.tsx`
- Test: `tests/unit/auth-guard.test.ts`

**Interfaces:**
- Consumes: `db`, `users` dari `@/db`
- Produces:
  - `{ handlers, auth, signIn, signOut }` dari `@/lib/auth`
  - `requireSession(): Promise<{ id: string; email: string }>` dari `@/actions/auth-guard` — melempar `SesiTidakValidError` bila tidak ada sesi
  - `class SesiTidakValidError extends Error` dari `@/actions/auth-guard`

- [ ] **Step 1: Buat rahasia Auth.js**

```bash
npx auth secret
```

Perintah ini menambahkan `AUTH_SECRET` ke `.env.local`.

- [ ] **Step 2: Konfigurasi Auth.js**

Create `src/lib/auth.ts`:

```ts
import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const email = String(credentials?.email ?? '').trim().toLowerCase();
        const password = String(credentials?.password ?? '');
        if (!email || !password) return null;

        const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
        if (!user) return null;

        const cocok = await bcrypt.compare(password, user.passwordHash);
        if (!cocok) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});
```

Create `src/app/api/auth/[...nextauth]/route.ts`:

```ts
export { GET, POST } from '@/lib/auth';
```

- [ ] **Step 3: Tulis tes penjaga sesi yang gagal**

Create `tests/unit/auth-guard.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));

const { requireSession, SesiTidakValidError } = await import('@/actions/auth-guard');

describe('requireSession', () => {
  beforeEach(() => authMock.mockReset());

  it('mengembalikan identitas pengguna bila sesi valid', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'admin@lians.id' } });
    await expect(requireSession()).resolves.toEqual({ id: 'u1', email: 'admin@lians.id' });
  });

  it('melempar bila tidak ada sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSession()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('melempar bila sesi ada tetapi tanpa id pengguna', async () => {
    authMock.mockResolvedValue({ user: {} });
    await expect(requireSession()).rejects.toBeInstanceOf(SesiTidakValidError);
  });
});
```

- [ ] **Step 4: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/auth-guard.test.ts`
Expected: FAIL — `Failed to resolve import "@/actions/auth-guard"`

- [ ] **Step 5: Implementasi penjaga sesi**

Create `src/actions/auth-guard.ts`:

```ts
import { auth } from '@/lib/auth';

export class SesiTidakValidError extends Error {
  constructor() {
    super('Sesi tidak valid. Silakan login kembali.');
    this.name = 'SesiTidakValidError';
  }
}

/**
 * Dipanggil di awal SETIAP Server Action admin.
 * Layout admin juga memeriksa sesi, tetapi layout tidak melindungi
 * permintaan yang menembak action secara langsung.
 */
export async function requireSession(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new SesiTidakValidError();
  return { id, email: session.user.email ?? '' };
}
```

- [ ] **Step 6: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/auth-guard.test.ts`
Expected: PASS, 3 tes

- [ ] **Step 7: Buat form login dan halamannya**

Create `src/components/admin/LoginForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';

type Values = { email: string; password: string };

export function LoginForm() {
  const { register, handleSubmit } = useForm<Values>();
  const [galat, setGalat] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    setGalat(null);
    const hasil = await signIn('credentials', { ...v, redirect: false });
    setMengirim(false);

    if (hasil?.error) {
      setGalat('Email atau kata sandi salah.');
      return;
    }
    window.location.href = '/';
  });

  return (
    <form onSubmit={kirim} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Email</span>
        <input
          type="email"
          autoComplete="username"
          {...register('email', { required: true })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Kata sandi</span>
        <input
          type="password"
          autoComplete="current-password"
          {...register('password', { required: true })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      {galat ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {galat}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={mengirim}
        className="w-full rounded-lg bg-lians-500 px-4 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Memproses…' : 'Masuk'}
      </button>
    </form>
  );
}
```

Halaman login berada di `(admin)/login`, **di luar** `(admin)/admin` — layout admin memaksa sesi, dan halaman login jelas tidak boleh mensyaratkannya.

Create `src/app/(admin)/login/page.tsx`:

```tsx
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const metadata = { title: 'Masuk — Admin LIANS' };

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect('/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="mb-1 text-2xl font-black text-lians-600">LIANS</h1>
        <p className="mb-6 text-sm text-muted">Panel administrasi</p>
        <LoginForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Buat navigasi dan layout admin**

Create `src/components/admin/AdminNav.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { LayoutDashboard, Car, CalendarCheck, Route, Star, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEM = [
  { href: '/', label: 'Dasbor', Icon: LayoutDashboard },
  { href: '/armada', label: 'Armada', Icon: Car },
  { href: '/booking', label: 'Booking', Icon: CalendarCheck },
  { href: '/rute', label: 'Rute Travel', Icon: Route },
  { href: '/testimoni', label: 'Testimoni', Icon: Star },
  { href: '/pengaturan', label: 'Pengaturan', Icon: Settings },
];

export function AdminNav({ email, pendingCount }: { email: string; pendingCount: number }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xl font-black text-lians-600">LIANS</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>

      <nav aria-label="Navigasi admin" className="flex-1 space-y-1 p-3">
        {ITEM.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
              pathname === href ? 'bg-lians-50 text-lians-700' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
            {href === '/booking' && pendingCount > 0 ? (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 border-t border-slate-200 px-5 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Keluar
      </button>
    </aside>
  );
}
```

Create `src/app/(admin)/login/layout.tsx` — pembungkus tanpa penjaga sesi, hanya menyediakan konteks sesi untuk `signIn`:

```tsx
import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';

export default function LoginLayout({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Create `src/app/(admin)/admin/layout.tsx` — semua yang di bawahnya wajib bersesi:

```tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/lib/auth';
import { getPendingCount } from '@/queries/bookings';
import { AdminNav } from '@/components/admin/AdminNav';

export const metadata = { title: 'Admin LIANS', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const pendingCount = await getPendingCount();

  return (
    <SessionProvider>
      <div className="flex min-h-screen bg-slate-50">
        <AdminNav email={session.user.email ?? ''} pendingCount={pendingCount} />
        <main className="flex-1 overflow-x-auto p-8">{children}</main>
        <Toaster position="top-right" richColors />
      </div>
    </SessionProvider>
  );
}
```

- [ ] **Step 9: Arahkan /login ke rute login pada routing hostname**

Modify `src/lib/host.ts` — `/login` pada host admin menuju `(admin)/login`, bukan `/admin/login`, dan `/login` diblokir dari domain publik:

```ts
export function resolveHost(host: string, pathname: string): HostResolution {
  const hostname = host.split(':')[0].toLowerCase();
  const isAdminHost = hostname === 'admin.localhost' || hostname.startsWith('admin.');

  if (pathname.startsWith('/admin')) return { kind: 'blocked' };
  if (!isAdminHost) return pathname === '/login' ? { kind: 'blocked' } : { kind: 'public' };

  // Halaman login punya rutenya sendiri di luar layout berpenjaga.
  if (pathname === '/login') return { kind: 'admin', rewriteTo: '/login' };

  return { kind: 'admin', rewriteTo: pathname === '/' ? '/admin' : `/admin${pathname}` };
}
```

Tambahkan kasus uji ke `tests/unit/proxy.test.ts`:

```ts
it('mengarahkan /login pada host admin ke rute login tanpa penjaga', () => {
  expect(resolveHost('admin.lians.id', '/login')).toEqual({ kind: 'admin', rewriteTo: '/login' });
});

it('memblokir /login dari domain publik', () => {
  expect(resolveHost('lians.id', '/login')).toEqual({ kind: 'blocked' });
});
```

- [ ] **Step 10: Buat dasbor dan halaman error admin**

Create `src/app/(admin)/admin/page.tsx`:

```tsx
import Link from 'next/link';
import { getBookings } from '@/queries/bookings';
import { getAllVehicles } from '@/queries/vehicles';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
// Panel admin berbahasa Indonesia saja, jadi locale-nya selalu 'id'.

export const dynamic = 'force-dynamic';

export default async function DasborPage() {
  const [semuaBooking, armada] = await Promise.all([getBookings(), getAllVehicles()]);
  const pending = semuaBooking.filter((b) => b.status === 'pending');

  const awalBulan = new Date();
  awalBulan.setDate(1);
  awalBulan.setHours(0, 0, 0, 0);
  const bulanIni = semuaBooking.filter((b) => new Date(b.createdAt) >= awalBulan);
  const nilaiBulanIni = bulanIni
    .filter((b) => b.status === 'confirmed' || b.status === 'completed')
    .reduce((jml, b) => jml + (b.totalPrice ?? 0), 0);

  const kartu = [
    { label: 'Menunggu konfirmasi', nilai: String(pending.length) },
    { label: 'Pesanan bulan ini', nilai: String(bulanIni.length) },
    { label: 'Nilai pesanan terkonfirmasi', nilai: formatRupiah(nilaiBulanIni) },
    { label: 'Kendaraan tayang', nilai: `${armada.filter((v) => v.isPublished).length} / ${armada.length}` },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Dasbor</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kartu.map((k) => (
          <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k.label}</p>
            <p className="mt-2 text-2xl font-black">{k.nilai}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">Pesanan menunggu konfirmasi</h2>
          <Link href="/booking" className="text-sm font-semibold text-lians-600">
            Lihat semua →
          </Link>
        </div>

        {pending.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted">
            Tidak ada pesanan yang menunggu. Semua sudah ditindaklanjuti.
          </p>
        ) : (
          <ul className="space-y-2">
            {pending.slice(0, 8).map((b) => (
              <li key={b.id}>
                <Link
                  href={`/booking/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-lians-300"
                >
                  <div>
                    <p className="font-semibold">
                      {b.customerName} — {b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '-'}
                    </p>
                    <p className="text-xs text-muted">
                      {b.bookingCode} · {formatTanggal(new Date(b.startDate), 'id')}
                    </p>
                  </div>
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

Create `src/app/(admin)/admin/error.tsx`:

```tsx
'use client';

export default function AdminError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8">
      <h1 className="text-lg font-bold text-red-800">Terjadi kesalahan</h1>
      <p className="mt-2 text-sm text-red-700">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white"
      >
        Coba lagi
      </button>
    </div>
  );
}
```

- [ ] **Step 11: Verifikasi login secara manual**

Run: `npm run dev`, buka `http://admin.localhost:3000`
Expected: dialihkan ke `/login`. Masuk dengan kredensial seed → dasbor tampil. Buka `http://localhost:3000/admin` → 404.

- [ ] **Step 13: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua (termasuk 8 tes proxy), build sukses

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: autentikasi admin, login, dan dasbor"
```

---
### Task 15: CRUD armada dan unggah foto Cloudinary

**Files:**
- Create: `src/lib/cloudinary.ts`, `src/actions/upload.ts`, `src/actions/admin-vehicles.ts`, `src/components/admin/ImageUploader.tsx`, `src/components/admin/VehicleForm.tsx`, `src/components/admin/StringListInput.tsx`, `src/components/admin/LocaleTabs.tsx`, `src/components/admin/LocalizedListInput.tsx`, `src/components/admin/LocalizedTextInput.tsx`, `src/app/(admin)/admin/armada/page.tsx`, `src/app/(admin)/admin/armada/baru/page.tsx`, `src/app/(admin)/admin/armada/[id]/page.tsx`
- Test: `tests/unit/slug-unik.test.ts`

**Interfaces:**
- Consumes: `requireSession`, `vehicleInputSchema`, `slugify`, `getAllVehicles`, `getVehicleById`, `ok`/`fail`
- Produces:
  - `getUploadSignature(): Promise<ActionResult<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>>` dari `@/actions/upload`
  - `<LocaleTabs active={Locale} filled={Record<Locale, boolean>} onChange={(l: Locale) => void} />` dari `@/components/admin/LocaleTabs`
  - `<LocalizedListInput label={string} values={Localized<string[]>} placeholder={string} onChange={(v: Localized<string[]>) => void} />` dari `@/components/admin/LocalizedListInput`
  - `<LocalizedTextInput label={string} values={Localized<string>} multiline={boolean} hint={string} onChange={(v: Localized<string>) => void} />` dari `@/components/admin/LocalizedTextInput`
  - `createVehicle(input: unknown)`, `updateVehicle(id: string, input: unknown)`, `deleteVehicle(id: string)` dari `@/actions/admin-vehicles`, semuanya `Promise<ActionResult<{ id: string }>>`
  - `slugUnik(dasar: string, terpakai: string[]): string` dari `@/lib/slug`

- [ ] **Step 1: Siapkan Cloudinary**

Buat akun gratis di https://cloudinary.com. Dari Dashboard salin *Cloud name*, *API Key*, dan *API Secret* ke `.env.local`:

```bash
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
```

- [ ] **Step 2: Tulis tes slug unik yang gagal**

Create `tests/unit/slug-unik.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { slugUnik } from '@/lib/slug';

describe('slugUnik', () => {
  it('memakai slug dasar bila belum terpakai', () => {
    expect(slugUnik('Innova Zenix G', [])).toBe('innova-zenix-g');
  });

  it('menambahkan angka bila slug sudah terpakai', () => {
    expect(slugUnik('Innova Zenix G', ['innova-zenix-g'])).toBe('innova-zenix-g-2');
  });

  it('terus menaikkan angka sampai menemukan yang bebas', () => {
    expect(slugUnik('Avanza', ['avanza', 'avanza-2', 'avanza-3'])).toBe('avanza-4');
  });

  it('memberi slug cadangan untuk nama tanpa huruf', () => {
    expect(slugUnik('###', [])).toMatch(/^kendaraan-/);
  });
});
```

- [ ] **Step 3: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/slug-unik.test.ts`
Expected: FAIL — `slugUnik` belum diekspor

- [ ] **Step 4: Implementasi slugUnik**

Tambahkan ke `src/lib/slug.ts`:

```ts
export function slugUnik(dasar: string, terpakai: string[]): string {
  const awal = slugify(dasar) || `kendaraan-${Date.now()}`;
  if (!terpakai.includes(awal)) return awal;

  let n = 2;
  while (terpakai.includes(`${awal}-${n}`)) n += 1;
  return `${awal}-${n}`;
}
```

- [ ] **Step 5: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/slug-unik.test.ts`
Expected: PASS, 4 tes

- [ ] **Step 6: Implementasi tanda tangan unggah**

Create `src/lib/cloudinary.ts`:

```ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const UPLOAD_FOLDER = 'lians/kendaraan';

export function signUpload(params: Record<string, string | number>): string {
  return cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);
}

export async function destroyImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
```

Create `src/actions/upload.ts`:

```ts
'use server';

import { signUpload, UPLOAD_FOLDER } from '@/lib/cloudinary';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

/**
 * Browser mengunggah langsung ke Cloudinary agar berkas tidak melewati
 * fungsi serverless — batas ukuran body dan waktu eksekusi tidak jadi masalah.
 * Tanda tangan dibuat di server supaya preset tidak bisa dipakai orang luar.
 */
export async function getUploadSignature(): Promise<
  ActionResult<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>
> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = signUpload({ timestamp, folder: UPLOAD_FOLDER });

  return ok({
    signature,
    timestamp,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    folder: UPLOAD_FOLDER,
  });
}
```

- [ ] **Step 7: Implementasi Server Action armada**

Create `src/actions/admin-vehicles.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles } from '@/db/schema';
import { vehicleInputSchema } from '@/schemas/vehicle';
import { slugUnik } from '@/lib/slug';
import { getAllVehicles } from '@/queries/vehicles';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

function segarkan(slug?: string) {
  revalidatePath('/');
  revalidatePath('/mobil');
  revalidatePath('/booking');
  revalidatePath('/sitemap.xml');
  if (slug) revalidatePath(`/mobil/${slug}`);
}

export async function createVehicle(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = vehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Periksa kembali isian Anda.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const terpakai = (await getAllVehicles()).map((v) => v.slug);
  const slug = slugUnik(parsed.data.slug || parsed.data.name, terpakai);

  const [row] = await db
    .insert(vehicles)
    .values({ ...parsed.data, slug, driverFeeOverride: null })
    .returning({ id: vehicles.id });

  segarkan(slug);
  return ok({ id: row.id });
}

export async function updateVehicle(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = vehicleInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Periksa kembali isian Anda.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const semua = await getAllVehicles();
  const lama = semua.find((v) => v.id === id);
  if (!lama) return fail('Kendaraan tidak ditemukan.');

  const diminta = parsed.data.slug || parsed.data.name;
  const slug =
    lama.slug === diminta
      ? lama.slug
      : slugUnik(diminta, semua.filter((v) => v.id !== id).map((v) => v.slug));

  await db
    .update(vehicles)
    .set({ ...parsed.data, slug, updatedAt: new Date() })
    .where(eq(vehicles.id, id));

  segarkan(slug);
  if (lama.slug !== slug) revalidatePath(`/mobil/${lama.slug}`);
  return ok({ id });
}

export async function deleteVehicle(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const [lama] = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  if (!lama) return fail('Kendaraan tidak ditemukan.');

  // Pesanan lama menyimpan nama kendaraan sebagai salinan beku,
  // jadi menghapus kendaraan tidak merusak riwayat pesanan.
  await db.delete(vehicles).where(eq(vehicles.id, id));

  segarkan(lama.slug);
  return ok({ id });
}
```

- [ ] **Step 8: Buat komponen unggah gambar**

Create `src/components/admin/ImageUploader.tsx`:

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getUploadSignature } from '@/actions/upload';
import type { VehicleImage } from '@/db/schema';

export function ImageUploader({
  images,
  onChange,
}: {
  images: VehicleImage[];
  onChange: (next: VehicleImage[]) => void;
}) {
  const [mengunggah, setMengunggah] = useState(false);

  async function unggah(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMengunggah(true);

    const tanda = await getUploadSignature();
    if (!tanda.ok) {
      toast.error(tanda.message);
      setMengunggah(false);
      return;
    }

    const terunggah: VehicleImage[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', tanda.data.apiKey);
      form.append('timestamp', String(tanda.data.timestamp));
      form.append('signature', tanda.data.signature);
      form.append('folder', tanda.data.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${tanda.data.cloudName}/image/upload`,
        { method: 'POST', body: form },
      );

      if (!res.ok) {
        toast.error(`Gagal mengunggah ${file.name}. Foto lain tetap tersimpan.`);
        continue;
      }

      const json = (await res.json()) as { secure_url: string; public_id: string };
      terunggah.push({ url: json.secure_url, publicId: json.public_id, alt: '' });
    }

    onChange([...images, ...terunggah]);
    setMengunggah(false);
    if (terunggah.length > 0) toast.success(`${terunggah.length} foto terunggah.`);
  }

  return (
    <div className="space-y-3">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold hover:border-lians-400">
        <Upload className="h-4 w-4" aria-hidden />
        {mengunggah ? 'Mengunggah…' : 'Tambah foto'}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={mengunggah}
          onChange={(e) => void unggah(e.target.files)}
          className="sr-only"
        />
      </label>

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.publicId} className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                <Image src={img.url} alt={img.alt || 'Foto kendaraan'} fill sizes="150px" className="object-cover" />
              </div>
              {i === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-lians-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Utama
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Hapus foto ${i + 1}`}
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">
          Foto pertama menjadi gambar utama di katalog. Kendaraan tetap bisa disimpan tanpa foto.
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 9: Buat input bertab bahasa**

Create `src/components/admin/LocaleTabs.tsx`:

```tsx
'use client';

import { cn } from '@/lib/cn';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n';

/**
 * Titik penanda pada tab memberi tahu sekilas bahasa mana yang masih kosong,
 * sehingga staf tidak perlu mengklik satu per satu untuk memeriksa.
 */
export function LocaleTabs({
  active,
  filled,
  onChange,
}: {
  active: Locale;
  filled: Record<Locale, boolean>;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div role="tablist" className="flex gap-1 border-b border-slate-200">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          role="tab"
          aria-selected={locale === active}
          onClick={() => onChange(locale)}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-semibold',
            locale === active
              ? 'border-lians-500 text-lians-700'
              : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          {LOCALE_LABELS[locale]}
          <span
            aria-label={filled[locale] ? 'terisi' : 'belum diisi'}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              filled[locale] ? 'bg-emerald-500' : 'bg-slate-300',
            )}
          />
        </button>
      ))}
    </div>
  );
}
```

Create `src/components/admin/LocalizedTextInput.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n';
import type { Localized } from '@/i18n/localized';
import { LocaleTabs } from './LocaleTabs';

export function LocalizedTextInput({
  label,
  values,
  hint,
  multiline = false,
  rows = 4,
  onChange,
}: {
  label: string;
  values: Localized<string>;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  onChange: (next: Localized<string>) => void;
}) {
  const [aktif, setAktif] = useState<Locale>(DEFAULT_LOCALE);

  const filled = Object.fromEntries(
    LOCALES.map((l) => [l, Boolean(values[l]?.trim())]),
  ) as Record<Locale, boolean>;

  const set = (teks: string) => onChange({ ...values, [aktif]: teks });
  const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold">
        {label}
        {aktif === DEFAULT_LOCALE ? <span className="text-red-500"> *</span> : null}
      </span>

      <LocaleTabs active={aktif} filled={filled} onChange={setAktif} />

      {multiline ? (
        <textarea
          rows={rows}
          value={values[aktif] ?? ''}
          onChange={(e) => set(e.target.value)}
          aria-label={`${label} (${aktif})`}
          className={kelas}
        />
      ) : (
        <input
          value={values[aktif] ?? ''}
          onChange={(e) => set(e.target.value)}
          aria-label={`${label} (${aktif})`}
          className={kelas}
        />
      )}

      <span className="block text-xs text-muted">
        {hint ??
          'Bahasa Indonesia wajib diisi. Bahasa lain boleh dikosongkan — pengunjung akan melihat versi Indonesia.'}
      </span>
    </div>
  );
}
```

Create `src/components/admin/LocalizedListInput.tsx` — sama polanya, tetapi isi tiap bahasa berupa daftar. Bagian dalamnya memakai `StringListInput` yang dibuat di langkah berikutnya:

```tsx
'use client';

import { useState } from 'react';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n';
import type { Localized } from '@/i18n/localized';
import { LocaleTabs } from './LocaleTabs';
import { StringListInput } from './StringListInput';

export function LocalizedListInput({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: Localized<string[]>;
  placeholder: string;
  onChange: (next: Localized<string[]>) => void;
}) {
  const [aktif, setAktif] = useState<Locale>(DEFAULT_LOCALE);

  const filled = Object.fromEntries(
    LOCALES.map((l) => [l, (values[l]?.length ?? 0) > 0]),
  ) as Record<Locale, boolean>;

  return (
    <div className="space-y-2">
      <LocaleTabs active={aktif} filled={filled} onChange={setAktif} />
      <StringListInput
        label={`${label} (${aktif})`}
        values={values[aktif] ?? []}
        placeholder={placeholder}
        onChange={(daftar) => onChange({ ...values, [aktif]: daftar })}
      />
    </div>
  );
}
```

- [ ] **Step 10: Buat input daftar teks dan form kendaraan**

Create `src/components/admin/StringListInput.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

export function StringListInput({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function tambah() {
    const teks = draft.trim();
    if (!teks) return;
    onChange([...values, teks]);
    setDraft('');
  }

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold">{label}</span>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              tambah();
            }
          }}
          placeholder={placeholder}
          aria-label={`Tambah ${label.toLowerCase()}`}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={tambah}
          aria-label={`Tambahkan ${label.toLowerCase()}`}
          className="rounded-lg border border-slate-300 px-3 hover:border-lians-400"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((v, i) => (
            <li key={`${v}-${i}`} className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm">
              {v}
              <button
                type="button"
                aria-label={`Hapus ${v}`}
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="text-slate-500 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

Create `src/components/admin/VehicleForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Vehicle, VehicleImage } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { ImageUploader } from './ImageUploader';
import { LocalizedListInput } from './LocalizedListInput';

type Values = {
  name: string;
  category: Vehicle['category'];
  rate24h: number;
  rate12h: number | '';
  seats: number;
  transmission: Vehicle['transmission'];
  fuelType: Vehicle['fuelType'];
  year: number;
  luggage: number;
  status: Vehicle['status'];
  isPublished: boolean;
  sortOrder: number;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function VehicleForm({
  vehicle,
  onSubmit,
}: {
  vehicle: Vehicle | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [images, setImages] = useState<VehicleImage[]>(vehicle?.images ?? []);
  const [features, setFeatures] = useState<Localized<string[]>>(vehicle?.features ?? { id: [] });
  const [rentalTerms, setRentalTerms] = useState<Localized<string[]>>(
    vehicle?.rentalTerms ?? { id: [] },
  );
  const [serviceTypes, setServiceTypes] = useState<string[]>(
    vehicle?.serviceTypes ?? ['self-drive'],
  );
  const [mengirim, setMengirim] = useState(false);

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      name: vehicle?.name ?? '',
      category: vehicle?.category ?? 'mpv',
      rate24h: vehicle?.rate24h ?? 0,
      rate12h: vehicle?.rate12h ?? '',
      seats: vehicle?.seats ?? 7,
      transmission: vehicle?.transmission ?? 'manual',
      fuelType: vehicle?.fuelType ?? 'petrol',
      year: vehicle?.year ?? new Date().getFullYear(),
      luggage: vehicle?.luggage ?? 2,
      status: vehicle?.status ?? 'available',
      isPublished: vehicle?.isPublished ?? true,
      sortOrder: vehicle?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    if (serviceTypes.length === 0) {
      toast.error('Pilih minimal satu jenis layanan.');
      return;
    }
    if ((features.id?.length ?? 0) === 0) {
      toast.error('Fasilitas versi bahasa Indonesia wajib diisi minimal satu.');
      return;
    }
    setMengirim(true);

    const hasil = await onSubmit({
      ...v,
      rate12h: v.rate12h === '' ? null : Number(v.rate12h),
      images,
      features,
      rentalTerms,
      serviceTypes,
    });

    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([field, pesan]) =>
        toast.error(`${field}: ${pesan.join(', ')}`),
      );
      return;
    }
    toast.success('Kendaraan tersimpan.');
    window.location.href = '/armada';
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama kendaraan</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Kategori</span>
          <select {...register('category')} className={kelas}>
            <option value="hatchback">Hatchback</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="mpv">MPV</option>
            <option value="luxury">Mewah</option>
            <option value="bus">Bus / Hiace</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif 24 jam (Rp)</span>
          <input type="number" min={0} step={50000} {...register('rate24h', { valueAsNumber: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif 12 jam (Rp)</span>
          <input type="number" min={0} step={50000} {...register('rate12h')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">Kosongkan bila tidak menyediakan paket 12 jam.</span>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Jumlah kursi</span>
          <input type="number" min={1} max={60} {...register('seats', { valueAsNumber: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Transmisi</span>
          <select {...register('transmission')} className={kelas}>
            <option value="manual">Manual</option>
            <option value="automatic">Matic</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Bahan bakar</span>
          <select {...register('fuelType')} className={kelas}>
            <option value="petrol">Bensin</option>
            <option value="diesel">Solar</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Listrik</option>
          </select>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Tahun</span>
          <input type="number" {...register('year', { valueAsNumber: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Kapasitas bagasi (koper)</span>
          <input type="number" min={0} {...register('luggage', { valueAsNumber: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Urutan tampil</span>
          <input type="number" {...register('sortOrder', { valueAsNumber: true })} className={kelas} />
        </label>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Jenis layanan</legend>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'self-drive', label: 'Lepas kunci' },
            { value: 'with-driver', label: 'Dengan sopir' },
            { value: 'tourism', label: 'Pariwisata' },
          ].map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={serviceTypes.includes(s.value)}
                onChange={(e) =>
                  setServiceTypes((prev) =>
                    e.target.checked ? [...prev, s.value] : prev.filter((x) => x !== s.value),
                  )
                }
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Status ketersediaan</span>
          <select {...register('status')} className={kelas}>
            <option value="available">Tersedia</option>
            <option value="unavailable">Sedang tersewa</option>
          </select>
        </label>
        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" {...register('isPublished')} />
          Tampilkan di situs publik
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold">Foto kendaraan</span>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <LocalizedListInput
        label="Fasilitas"
        values={features}
        placeholder="AC Dingin"
        onChange={setFeatures}
      />
      <LocalizedListInput
        label="Syarat sewa"
        values={rentalTerms}
        placeholder="Jaminan KTP + KK"
        onChange={setRentalTerms}
      />

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan kendaraan'}
      </button>
    </form>
  );
}
```

- [ ] **Step 11: Buat halaman daftar, tambah, dan ubah armada**

Create `src/app/(admin)/admin/armada/page.tsx`:

```tsx
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getAllVehicles } from '@/queries/vehicles';
import { formatRupiah } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ArmadaPage() {
  const armada = await getAllVehicles();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black">Armada</h1>
        <Link
          href="/armada/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah kendaraan
        </Link>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Nama</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">24 jam</th>
              <th className="p-4">12 jam</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tayang</th>
            </tr>
          </thead>
          <tbody>
            {armada.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/armada/${v.id}`} className="font-semibold text-lians-700">
                    {v.name}
                  </Link>
                </td>
                <td className="p-4 capitalize">{v.category}</td>
                <td className="p-4">{formatRupiah(v.rate24h)}</td>
                <td className="p-4">{v.rate12h === null ? '—' : formatRupiah(v.rate12h)}</td>
                <td className="p-4">{v.status === 'available' ? 'Tersedia' : 'Tersewa'}</td>
                <td className="p-4">{v.isPublished ? 'Ya' : 'Tidak'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {armada.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada kendaraan. Tambahkan yang pertama.</p>
        ) : null}
      </div>
    </div>
  );
}
```

Create `src/app/(admin)/admin/armada/baru/page.tsx`:

```tsx
import { VehicleForm } from '@/components/admin/VehicleForm';
import { createVehicle } from '@/actions/admin-vehicles';

export default function ArmadaBaruPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Kendaraan</h1>
      <VehicleForm vehicle={null} onSubmit={createVehicle} />
    </div>
  );
}
```

Create `src/app/(admin)/admin/armada/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getVehicleById } from '@/queries/vehicles';
import { VehicleForm } from '@/components/admin/VehicleForm';
import { updateVehicle, deleteVehicle } from '@/actions/admin-vehicles';
import { DeleteButton } from '@/components/admin/DeleteButton';

export const dynamic = 'force-dynamic';

export default async function ArmadaEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateVehicle(id, input);
  }

  async function hapus() {
    'use server';
    return deleteVehicle(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Ubah: {vehicle.name}</h1>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/armada"
          konfirmasi={`Hapus ${vehicle.name}? Riwayat pesanan tetap tersimpan.`}
        />
      </div>
      <VehicleForm vehicle={vehicle} onSubmit={simpan} />
    </div>
  );
}
```

Create `src/components/admin/DeleteButton.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';

export function DeleteButton({
  onDelete,
  redirectTo,
  konfirmasi,
}: {
  onDelete: () => Promise<ActionResult<{ id: string }>>;
  redirectTo: string;
  konfirmasi: string;
}) {
  const [menghapus, setMenghapus] = useState(false);

  async function klik() {
    if (!window.confirm(konfirmasi)) return;
    setMenghapus(true);
    const hasil = await onDelete();
    setMenghapus(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    window.location.href = redirectTo;
  }

  return (
    <button
      type="button"
      onClick={klik}
      disabled={menghapus}
      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden /> {menghapus ? 'Menghapus…' : 'Hapus'}
    </button>
  );
}
```

- [ ] **Step 12: Verifikasi CRUD armada secara manual**

Run: `npm run dev`, buka `http://admin.localhost:3000/armada/baru`

Expected:
1. Tambah kendaraan baru dengan satu foto dan fasilitas versi Indonesia + Inggris → tersimpan
2. Muncul di `http://localhost:3000/mobil` tanpa restart server
3. `http://localhost:3000/en/mobil/<slug>` menampilkan fasilitas berbahasa Inggris
4. `http://localhost:3000/ko/mobil/<slug>` menampilkan fasilitas berbahasa Indonesia — jatuh-balik bekerja
5. Tab bahasa yang belum diisi bertitik abu-abu, yang sudah diisi bertitik hijau

- [ ] **Step 12: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: CRUD armada, input bertab bahasa, dan unggah foto Cloudinary"
```

---

### Task 16: CRUD booking, rute, testimoni, dan pengaturan

**Files:**
- Create: `src/actions/admin-bookings.ts`, `src/actions/admin-routes.ts`, `src/actions/admin-testimonials.ts`, `src/actions/admin-settings.ts`, `src/components/admin/BookingStatusForm.tsx`, `src/components/admin/RouteForm.tsx`, `src/components/admin/TestimonialForm.tsx`, `src/components/admin/SettingsForm.tsx`, dan halaman `admin/booking`, `admin/booking/[id]`, `admin/rute`, `admin/rute/baru`, `admin/rute/[id]`, `admin/testimoni`, `admin/testimoni/baru`, `admin/testimoni/[id]`, `admin/pengaturan`
- Test: `tests/unit/admin-actions.test.ts`

**Interfaces:**
- Consumes: `requireSession`, skema Zod dari `@/schemas/*`, query dari `@/queries/*`
- Produces:
  - `@/actions/admin-bookings`: `updateBookingStatus(id, status, adminNotes)`, `deleteBooking(id)`
  - `@/actions/admin-routes`: `createRoute(input)`, `updateRoute(id, input)`, `deleteRoute(id)`
  - `@/actions/admin-testimonials`: `createTestimonial(input)`, `updateTestimonial(id, input)`, `deleteTestimonial(id)`
  - `@/actions/admin-settings`: `updateSettings(input)`
  - Semua mengembalikan `Promise<ActionResult<{ id: string }>>` kecuali `updateSettings` yang mengembalikan `Promise<ActionResult<{ ok: true }>>`

- [ ] **Step 1: Tulis tes penjagaan sesi pada action admin**

Create `tests/unit/admin-actions.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const dbMock = { update: vi.fn(), insert: vi.fn(), delete: vi.fn(), select: vi.fn() };
vi.mock('@/db', () => ({ db: dbMock }));

const { updateBookingStatus } = await import('@/actions/admin-bookings');
const { createRoute } = await import('@/actions/admin-routes');
const { updateSettings } = await import('@/actions/admin-settings');

describe('penjagaan sesi pada Server Action admin', () => {
  beforeEach(() => {
    authMock.mockReset();
    authMock.mockResolvedValue(null);
  });

  it('updateBookingStatus menolak tanpa sesi', async () => {
    const hasil = await updateBookingStatus('id', 'confirmed', null);
    expect(hasil).toMatchObject({ ok: false });
    expect(dbMock.update).not.toHaveBeenCalled();
  });

  it('createRoute menolak tanpa sesi', async () => {
    const hasil = await createRoute({ origin: 'Manado', destination: 'Bitung' });
    expect(hasil).toMatchObject({ ok: false });
    expect(dbMock.insert).not.toHaveBeenCalled();
  });

  it('updateSettings menolak tanpa sesi', async () => {
    const hasil = await updateSettings({});
    expect(hasil).toMatchObject({ ok: false });
  });
});
```

- [ ] **Step 2: Jalankan tes, pastikan gagal**

Run: `npm test -- tests/unit/admin-actions.test.ts`
Expected: FAIL — modul action belum ada

- [ ] **Step 3: Implementasi action booking**

Create `src/actions/admin-bookings.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/db';
import { bookings } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

const statusSchema = z.enum(['pending', 'confirmed', 'cancelled', 'completed']);

export async function updateBookingStatus(
  id: string,
  status: unknown,
  adminNotes: string | null,
): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return fail('Status pesanan tidak dikenal.');

  await db
    .update(bookings)
    .set({ status: parsed.data, adminNotes, updatedAt: new Date() })
    .where(eq(bookings.id, id));

  revalidatePath('/booking');
  revalidatePath(`/booking/${id}`);
  revalidatePath('/');
  return ok({ id });
}

export async function deleteBooking(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  await db.delete(bookings).where(eq(bookings.id, id));
  revalidatePath('/booking');
  revalidatePath('/');
  return ok({ id });
}
```

- [ ] **Step 4: Implementasi action rute dan testimoni**

Create `src/actions/admin-routes.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { travelRoutes } from '@/db/schema';
import { routeInputSchema } from '@/schemas/route';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

function segarkan() {
  revalidatePath('/');
  revalidatePath('/travel');
  revalidatePath('/booking');
}

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createRoute(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = routeInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Periksa kembali isian Anda.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const [row] = await db.insert(travelRoutes).values(parsed.data).returning({ id: travelRoutes.id });
  segarkan();
  return ok({ id: row.id });
}

export async function updateRoute(id: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = routeInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Periksa kembali isian Anda.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  await db
    .update(travelRoutes)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(travelRoutes.id, id));

  segarkan();
  return ok({ id });
}

export async function deleteRoute(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  await db.delete(travelRoutes).where(eq(travelRoutes.id, id));
  segarkan();
  return ok({ id });
}
```

Create `src/actions/admin-testimonials.ts` dengan bentuk yang sama, menukar `travelRoutes` → `testimonials`, `routeInputSchema` → `testimonialInputSchema`, dan `segarkan()` menjadi:

```ts
function segarkan() {
  revalidatePath('/');
  revalidatePath('/testimoni');
}
```

Ekspornya: `createTestimonial`, `updateTestimonial`, `deleteTestimonial`.

- [ ] **Step 5: Implementasi action pengaturan**

Create `src/actions/admin-settings.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import { settingsInputSchema } from '@/schemas/settings';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

export async function updateSettings(input: unknown): Promise<ActionResult<{ ok: true }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = settingsInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Periksa kembali isian Anda.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    await db
      .insert(siteSettings)
      .values({ key, value: value as never })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: value as never, updatedAt: new Date() },
      });
  }

  // Tarif sopir dan nomor WhatsApp muncul hampir di semua halaman.
  revalidatePath('/', 'layout');
  return ok({ ok: true });
}
```

- [ ] **Step 6: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/admin-actions.test.ts`
Expected: PASS, 3 tes

- [ ] **Step 7: Buat halaman daftar dan detail booking**

Create `src/app/(admin)/admin/booking/page.tsx`:

```tsx
import Link from 'next/link';
import { getBookings } from '@/queries/bookings';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
// Panel admin berbahasa Indonesia saja, jadi locale-nya selalu 'id'.

export const dynamic = 'force-dynamic';

const LABEL_STATUS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  cancelled: 'Dibatalkan',
  completed: 'Selesai',
};

const WARNA_STATUS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-slate-200 text-slate-700',
};

export default async function BookingListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const valid = ['pending', 'confirmed', 'cancelled', 'completed'] as const;
  const filter = valid.find((s) => s === status);
  const daftar = await getBookings(filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Booking</h1>

      <nav aria-label="Filter status" className="flex flex-wrap gap-2">
        <Link
          href="/booking"
          className={`rounded-lg px-3 py-1.5 text-sm font-medium ${!filter ? 'bg-lians-500 text-white' : 'bg-white text-slate-600'}`}
        >
          Semua
        </Link>
        {valid.map((s) => (
          <Link
            key={s}
            href={`/booking?status=${s}`}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${filter === s ? 'bg-lians-500 text-white' : 'bg-white text-slate-600'}`}
          >
            {LABEL_STATUS[s]}
          </Link>
        ))}
      </nav>

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Kode</th>
              <th className="p-4">Customer</th>
              <th className="p-4">Pesanan</th>
              <th className="p-4">Mulai</th>
              <th className="p-4">Total</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {daftar.map((b) => (
              <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                <td className="p-4">
                  <Link href={`/booking/${b.id}`} className="font-mono text-xs font-semibold text-lians-700">
                    {b.bookingCode}
                  </Link>
                </td>
                <td className="p-4">
                  <span className="block font-semibold">{b.customerName}</span>
                  <span className="text-xs text-muted">{b.phone}</span>
                </td>
                <td className="p-4">{b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—'}</td>
                <td className="p-4">{formatTanggal(new Date(b.startDate), 'id')}</td>
                <td className="p-4">{b.totalPrice === null ? 'Menunggu penawaran' : formatRupiah(b.totalPrice)}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${WARNA_STATUS[b.status]}`}>
                    {LABEL_STATUS[b.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {daftar.length === 0 ? <p className="p-12 text-center text-muted">Belum ada pesanan.</p> : null}
      </div>
    </div>
  );
}
```

Create `src/components/admin/BookingStatusForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';

export function BookingStatusForm({
  status,
  adminNotes,
  onSave,
}: {
  status: string;
  adminNotes: string | null;
  onSave: (status: string, adminNotes: string | null) => Promise<ActionResult<{ id: string }>>;
}) {
  const [nilai, setNilai] = useState(status);
  const [catatan, setCatatan] = useState(adminNotes ?? '');
  const [menyimpan, setMenyimpan] = useState(false);

  async function simpan() {
    setMenyimpan(true);
    const hasil = await onSave(nilai, catatan || null);
    setMenyimpan(false);
    toast[hasil.ok ? 'success' : 'error'](hasil.ok ? 'Status diperbarui.' : hasil.message);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Status pesanan</span>
        <select
          value={nilai}
          onChange={(e) => setNilai(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="pending">Menunggu</option>
          <option value="confirmed">Dikonfirmasi</option>
          <option value="cancelled">Dibatalkan</option>
          <option value="completed">Selesai</option>
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Catatan internal</span>
        <textarea
          rows={4}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          placeholder="Sudah DP 500rb, ambil unit jam 9 pagi…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
        <span className="mt-1 block text-xs text-muted">Tidak terlihat oleh customer.</span>
      </label>

      <button
        type="button"
        onClick={simpan}
        disabled={menyimpan}
        className="rounded-lg bg-lians-500 px-5 py-2 text-sm font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {menyimpan ? 'Menyimpan…' : 'Simpan perubahan'}
      </button>
    </div>
  );
}
```

Create `src/app/(admin)/admin/booking/[id]/page.tsx`:

```tsx
import { notFound } from 'next/navigation';
import { getBookingById } from '@/queries/bookings';
import { updateBookingStatus, deleteBooking } from '@/actions/admin-bookings';
import { BookingStatusForm } from '@/components/admin/BookingStatusForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
// Panel admin berbahasa Indonesia saja, jadi locale-nya selalu 'id'.
import { waLink } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await getBookingById(id);
  if (!b) notFound();

  async function simpan(status: string, adminNotes: string | null) {
    'use server';
    return updateBookingStatus(id, status, adminNotes);
  }

  async function hapus() {
    'use server';
    return deleteBooking(id);
  }

  const rincian = b.priceBreakdown;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-mono text-2xl font-black">{b.bookingCode}</h1>
        <div className="flex gap-2">
          <a
            href={waLink(b.phone, `Halo ${b.customerName}, terima kasih sudah memesan di LIANS (${b.bookingCode}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Chat customer
          </a>
          <DeleteButton onDelete={hapus} redirectTo="/booking" konfirmasi={`Hapus pesanan ${b.bookingCode}?`} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <dl className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 text-sm">
          {[
            ['Nama', b.customerName],
            ['Telepon', b.phone],
            ['Email', b.email ?? '—'],
            ['Layanan', b.serviceType],
            ['Pesanan', b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—'],
            ['Mulai', formatTanggal(new Date(b.startDate), 'id')],
            ['Selesai', b.endDate ? formatTanggal(new Date(b.endDate), 'id') : '—'],
            ['Paket tarif', b.rateType ? `${b.rateType === '12h' ? '12' : '24'} jam` : '—'],
            ['Hari pakai sopir', String(b.driverDays)],
            ['Catatan customer', b.notes ?? '—'],
            ['Dibuat', formatTanggal(new Date(b.createdAt), 'id')],
          ].map(([label, nilai]) => (
            <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
              <dt className="text-muted">{label}</dt>
              <dd className="text-right font-medium">{nilai}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-4">
          <div className="rounded-2xl border border-lians-200 bg-lians-50 p-5">
            <p className="text-sm font-semibold">Total</p>
            <p className="text-2xl font-black text-lians-700">
              {b.totalPrice === null ? 'Menunggu penawaran' : formatRupiah(b.totalPrice)}
            </p>
            {rincian ? (
              <ul className="mt-3 space-y-1 text-xs text-slate-600">
                <li>
                  Sewa {rincian.days} hari × {formatRupiah(rincian.ratePerDay)} ={' '}
                  {formatRupiah(rincian.rentalCost)}
                </li>
                {rincian.driverDays > 0 ? (
                  <li>
                    Sopir {rincian.driverDays} hari × {formatRupiah(rincian.driverFeePerDay)} ={' '}
                    {formatRupiah(rincian.driverCost)}
                  </li>
                ) : null}
              </ul>
            ) : null}
            <p className="mt-3 text-xs text-muted">
              Angka ini dibekukan saat pesanan dibuat dan tidak berubah walau tarif diperbarui.
            </p>
          </div>

          <BookingStatusForm status={b.status} adminNotes={b.adminNotes} onSave={simpan} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 8: Buat halaman rute dan testimoni**

Create `src/components/admin/RouteForm.tsx` — form dengan isian `origin`, `destination`, `price` (kosong berarti "hubungi untuk harga"), `vehicleNote`, `estimatedDuration`, `isPublished`, `sortOrder`. Mengikuti pola `VehicleForm`: `useForm`, panggil `onSubmit`, tampilkan `toast`, arahkan ke `/rute` saat sukses.

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { TravelRoute } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';

type Values = {
  origin: string;
  destination: string;
  price: number | '';
  isPublished: boolean;
  sortOrder: number;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function RouteForm({
  route,
  onSubmit,
}: {
  route: TravelRoute | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const [vehicleNote, setVehicleNote] = useState<Localized<string>>(
    route?.vehicleNote ?? { id: '' },
  );
  const [estimatedDuration, setEstimatedDuration] = useState<Localized<string>>(
    route?.estimatedDuration ?? { id: '' },
  );

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      origin: route?.origin ?? 'Manado',
      destination: route?.destination ?? '',
      price: route?.price ?? '',
      isPublished: route?.isPublished ?? true,
      sortOrder: route?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      price: v.price === '' ? null : Number(v.price),
      vehicleNote: vehicleNote.id?.trim() ? vehicleNote : null,
      estimatedDuration: estimatedDuration.id?.trim() ? estimatedDuration : null,
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    toast.success('Rute tersimpan.');
    window.location.href = '/rute';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Asal</span>
          <input {...register('origin', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Tujuan</span>
          <input {...register('destination', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif sekali jalan (Rp)</span>
          <input type="number" min={0} step={25000} {...register('price')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Kosongkan bila tarif belum ditetapkan — situs akan menampilkan tombol “Hubungi untuk harga”.
          </span>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Urutan tampil</span>
          <input type="number" {...register('sortOrder', { valueAsNumber: true })} className={kelas} />
        </label>
      </div>

      <LocalizedTextInput
        label="Catatan kendaraan"
        values={vehicleNote}
        onChange={setVehicleNote}
        hint="Contoh: Avanza / Xenia. Boleh dikosongkan seluruhnya."
      />

      <LocalizedTextInput
        label="Perkiraan waktu tempuh"
        values={estimatedDuration}
        onChange={setEstimatedDuration}
        hint="Contoh: 45 menit / 45 minutes / 45 分钟 / 45분."
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isPublished')} /> Tampilkan di situs publik
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan rute'}
      </button>
    </form>
  );
}
```

Create `src/components/admin/TestimonialForm.tsx` dengan pola identik: `customerName`, `rating` (select 1–5), `vehicleName`, `date` (input tanggal), `isFeatured`, `isPublished`, `sortOrder` sebagai isian biasa, dan `reviewText` memakai `<LocalizedTextInput multiline rows={4} />` karena isi ulasan diterjemahkan. Arahkan ke `/testimoni` saat sukses.

Nama pelanggan tidak diterjemahkan — itu nama orang.

Buat halaman-halaman berikut mengikuti pola persis `admin/armada`:

- `src/app/(admin)/admin/rute/page.tsx` — tabel rute: Asal → Tujuan, Tarif (`—` bila `null`), Waktu, Tayang; tombol “Tambah rute” ke `/rute/baru`
- `src/app/(admin)/admin/rute/baru/page.tsx` — `<RouteForm route={null} onSubmit={createRoute} />`
- `src/app/(admin)/admin/rute/[id]/page.tsx` — ambil dengan `getRouteById`, `notFound()` bila kosong, bungkus `updateRoute(id, input)` dan `deleteRoute(id)` sebagai fungsi `'use server'`, sertakan `<DeleteButton redirectTo="/rute" />`
- `src/app/(admin)/admin/testimoni/page.tsx` — tabel testimoni: Nama, Rating, Kendaraan, Tanggal, Unggulan, Tayang
- `src/app/(admin)/admin/testimoni/baru/page.tsx` dan `src/app/(admin)/admin/testimoni/[id]/page.tsx` — sama polanya, `redirectTo="/testimoni"`

- [ ] **Step 9: Buat halaman pengaturan**

Create `src/components/admin/SettingsForm.tsx`:

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { SettingsInput } from '@/schemas/settings';
import type { ActionResult } from '@/actions/result';
import { LocalizedTextInput } from './LocalizedTextInput';

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function SettingsForm({
  settings,
  onSubmit,
}: {
  settings: SettingsInput;
  onSubmit: (input: unknown) => Promise<ActionResult<{ ok: true }>>;
}) {
  const [menyimpan, setMenyimpan] = useState(false);
  const [operatingHours, setOperatingHours] = useState(settings.operatingHours);
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle);
  const [promoBanner, setPromoBanner] = useState(settings.promoBanner);
  const [aboutText, setAboutText] = useState(settings.aboutText);

  const { register, handleSubmit } = useForm<SettingsInput>({ defaultValues: settings });

  const kirim = handleSubmit(async (v) => {
    setMenyimpan(true);
    const hasil = await onSubmit({
      ...v,
      socialLinks: settings.socialLinks,
      operatingHours,
      heroTitle,
      heroSubtitle,
      promoBanner,
      aboutText,
    });
    setMenyimpan(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([field, pesan]) =>
        toast.error(`${field}: ${pesan.join(', ')}`),
      );
      return;
    }
    toast.success('Pengaturan tersimpan. Situs publik langsung diperbarui.');
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Kontak</h2>
        <label>
          <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
          <input {...register('whatsappNumber')} placeholder="081234567890" className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Telepon</span>
          <input {...register('phone')} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Email</span>
          <input type="email" {...register('email')} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Alamat</span>
          <textarea rows={2} {...register('address')} className={kelas} />
        </label>
        <LocalizedTextInput
          label="Jam operasional"
          values={operatingHours}
          onChange={setOperatingHours}
        />
        <label>
          <span className="mb-1 block text-sm font-semibold">URL sematan Google Maps</span>
          <input {...register('mapsUrl')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Kosongkan untuk memakai peta otomatis berdasarkan alamat di atas.
          </span>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Harga</h2>
        <label>
          <span className="mb-1 block text-sm font-semibold">Biaya sopir per hari (Rp)</span>
          <input type="number" min={0} step={25000} {...register('driverFeePerDay', { valueAsNumber: true })} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Berlaku untuk seluruh armada. Mengubah nilai ini memengaruhi perkiraan harga di situs,
            tetapi tidak mengubah pesanan yang sudah masuk.
          </span>
        </label>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Teks halaman</h2>

        <LocalizedTextInput label="Judul hero" values={heroTitle} onChange={setHeroTitle} />
        <LocalizedTextInput
          label="Subjudul hero"
          values={heroSubtitle}
          onChange={setHeroSubtitle}
          multiline
          rows={2}
        />
        <LocalizedTextInput
          label="Banner promo"
          values={promoBanner}
          onChange={setPromoBanner}
          hint="Kosongkan seluruh bahasa untuk menyembunyikan banner."
        />
        <LocalizedTextInput
          label="Teks halaman Tentang"
          values={aboutText}
          onChange={setAboutText}
          multiline
          rows={8}
          hint="Pisahkan paragraf dengan satu baris kosong."
        />
      </section>

      <button
        type="submit"
        disabled={menyimpan}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {menyimpan ? 'Menyimpan…' : 'Simpan pengaturan'}
      </button>
    </form>
  );
}
```

Create `src/app/(admin)/admin/pengaturan/page.tsx`:

```tsx
import { getSettings } from '@/queries/settings';
import { updateSettings } from '@/actions/admin-settings';
import { SettingsForm } from '@/components/admin/SettingsForm';

export const dynamic = 'force-dynamic';

export default async function PengaturanPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Pengaturan Situs</h1>
      <SettingsForm settings={settings} onSubmit={updateSettings} />
    </div>
  );
}
```

- [ ] **Step 10: Tambahkan pengelolaan akun staf**

Spesifikasi menyebut akun staf dikelola dari halaman Pengaturan. Tanpa ini, satu-satunya cara menambah staf adalah menjalankan ulang skrip seed di mesin developer.

Create `src/queries/users.ts`:

```ts
import { asc } from 'drizzle-orm';
import { db } from '@/db';
import { users } from '@/db/schema';

export async function getUsers() {
  return db
    .select({ id: users.id, email: users.email, name: users.name, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.createdAt));
}
```

Create `src/actions/admin-users.ts`:

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { eq, count } from 'drizzle-orm';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { users } from '@/db/schema';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

const userInputSchema = z.object({
  name: z.string().trim().min(2, 'Nama wajib diisi').max(100),
  email: z.string().trim().toLowerCase().email('Format email tidak valid'),
  password: z.string().min(8, 'Kata sandi minimal 8 karakter'),
});

export async function createUser(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const parsed = userInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Periksa kembali isian Anda.', parsed.error.flatten().fieldErrors as Record<string, string[]>);
  }

  const [ada] = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (ada) return fail('Email itu sudah dipakai akun lain.');

  const [row] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email: parsed.data.email,
      passwordHash: await bcrypt.hash(parsed.data.password, 12),
    })
    .returning({ id: users.id });

  revalidatePath('/pengaturan');
  return ok({ id: row.id });
}

export async function deleteUser(id: string): Promise<ActionResult<{ id: string }>> {
  let sesi;
  try {
    sesi = await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  if (sesi.id === id) return fail('Anda tidak bisa menghapus akun yang sedang Anda pakai.');

  // Menghapus akun terakhir akan mengunci semua orang di luar panel.
  const [{ jumlah }] = await db.select({ jumlah: count() }).from(users);
  if (jumlah <= 1) return fail('Tidak bisa menghapus akun terakhir.');

  await db.delete(users).where(eq(users.id, id));
  revalidatePath('/pengaturan');
  return ok({ id });
}
```

Create `src/components/admin/StaffSection.tsx` — daftar akun dengan tombol hapus per baris, plus form tambah berisi nama, email, dan kata sandi. Polanya sama dengan `RouteForm`: `useForm`, panggil action, tampilkan `toast`, lalu `window.location.reload()` setelah sukses. Tombol hapus memakai `DeleteButton` dengan `redirectTo="/pengaturan"`.

Tambahkan bagian ini ke `src/app/(admin)/admin/pengaturan/page.tsx`, di bawah `<SettingsForm />`:

```tsx
import { getUsers } from '@/queries/users';
import { createUser, deleteUser } from '@/actions/admin-users';
import { StaffSection } from '@/components/admin/StaffSection';

// …di dalam komponen halaman:
const [settings, staf] = await Promise.all([getSettings(), getUsers()]);

// …di dalam JSX, setelah SettingsForm:
<StaffSection users={staf} onCreate={createUser} onDelete={deleteUser} />
```

Tambahkan tes penjagaan sesi ke `tests/unit/admin-actions.test.ts`:

```ts
const { createUser } = await import('@/actions/admin-users');

it('createUser menolak tanpa sesi', async () => {
  const hasil = await createUser({ name: 'Staf', email: 'staf@lians.id', password: 'rahasia123' });
  expect(hasil).toMatchObject({ ok: false });
  expect(dbMock.insert).not.toHaveBeenCalled();
});
```

Run: `npm test -- tests/unit/admin-actions.test.ts`
Expected: PASS, 4 tes

- [ ] **Step 11: Verifikasi CRUD secara manual**

Run: `npm run dev`. Di `http://admin.localhost:3000`:
1. Ubah biaya sopir jadi 200000 di Pengaturan → buka `http://localhost:3000/booking`, perkiraan sopir ikut berubah.
2. Tambah rute tanpa tarif → muncul di `/travel` dengan tombol “Hubungi untuk harga”, dan di `/en/travel` dengan “Contact for price”.
3. Ubah status satu booking jadi `confirmed` → hitungan “Menunggu konfirmasi” di dasbor berkurang.
4. Isi judul hero versi Korea saja lalu simpan → `http://localhost:3000/ko` menampilkan judul Korea, `http://localhost:3000/zh` tetap menampilkan versi Indonesia.

- [ ] **Step 12: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: CRUD booking, rute travel, testimoni, pengaturan situs, dan akun staf"
```

---

### Task 17: Tes integrasi alur penuh dan penerbitan

**Files:**
- Create: `tests/integration/alur-penuh.test.ts`, `README.md`, `vercel.json`
- Test: `tests/integration/alur-penuh.test.ts`

**Interfaces:**
- Consumes: seluruh action dan query dari tugas sebelumnya
- Produces: situs live di `lians.id` dan `admin.lians.id`

- [ ] **Step 1: Tulis tes integrasi alur penuh**

Create `tests/integration/alur-penuh.test.ts`:

```ts
import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-forwarded-for', '203.0.113.10']]) as unknown as Headers,
}));
vi.mock('@/lib/auth', () => ({ auth: async () => ({ user: { id: 'tes', email: 'tes@lians.id' } }) }));

const { db } = await import('@/db');
const { vehicles, bookings } = await import('@/db/schema');
const { createVehicle, deleteVehicle } = await import('@/actions/admin-vehicles');
const { createBooking } = await import('@/actions/booking');
const { updateBookingStatus } = await import('@/actions/admin-bookings');
const { getPublishedVehicles } = await import('@/queries/vehicles');
const { getBookingById } = await import('@/queries/bookings');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: { vehicleId?: string; bookingId?: string } = {};

jalankan('alur penuh: admin membuat kendaraan → customer memesan → admin mengonfirmasi', () => {
  it('kendaraan yang dibuat admin muncul di katalog publik', async () => {
    const hasil = await createVehicle({
      name: `Uji Integrasi ${Date.now()}`,
      category: 'mpv',
      rate24h: 600000,
      rate12h: 400000,
      serviceTypes: ['self-drive', 'with-driver'],
      seats: 7,
      transmission: 'automatic',
      fuelType: 'petrol',
      year: 2024,
      luggage: 2,
      features: { id: ['AC Dingin'], en: ['Cold AC'] },
      rentalTerms: { id: ['Lepas kunci'] },
      images: [],
      status: 'available',
      isPublished: true,
      sortOrder: 999,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    dibuat.vehicleId = hasil.data.id;

    const katalog = await getPublishedVehicles();
    expect(katalog.some((v) => v.id === dibuat.vehicleId)).toBe(true);
  });

  it('pesanan customer tersimpan dengan harga yang dihitung server', async () => {
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    const lima = new Date(besok);
    lima.setDate(lima.getDate() + 5);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const hasil = await createBooking({
      serviceType: 'with-driver',
      vehicleId: dibuat.vehicleId,
      startDate: iso(besok),
      endDate: iso(lima),
      rateType: '24h',
      driverDays: 3,
      customerName: 'Uji Integrasi',
      phone: '081234567890',
      email: '',
      notes: '',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.data.bookingCode).toMatch(/^LNS-\d{8}-[A-Z2-9]{4}$/);
    expect(hasil.data.whatsappUrl).toContain('wa.me/');

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.bookingCode, hasil.data.bookingCode))
      .limit(1);

    dibuat.bookingId = row.id;
    expect(row.status).toBe('pending');
    // 5 hari × 600.000 + 3 hari × tarif sopir global
    expect(row.priceBreakdown?.rentalCost).toBe(3_000_000);
    expect(row.priceBreakdown?.driverDays).toBe(3);
    expect(row.totalPrice).toBe(
      (row.priceBreakdown?.rentalCost ?? 0) + (row.priceBreakdown?.driverCost ?? 0),
    );
  });

  it('menolak pesanan dengan hari sopir melebihi durasi', async () => {
    const besok = new Date();
    besok.setDate(besok.getDate() + 1);
    const lusa = new Date(besok);
    lusa.setDate(lusa.getDate() + 2);
    const iso = (d: Date) => d.toISOString().slice(0, 10);

    const hasil = await createBooking({
      serviceType: 'with-driver',
      vehicleId: dibuat.vehicleId,
      startDate: iso(besok),
      endDate: iso(lusa),
      rateType: '24h',
      driverDays: 9,
      customerName: 'Uji Curang',
      phone: '081234567890',
    });

    expect(hasil.ok).toBe(false);
  });

  it('admin dapat mengubah status pesanan menjadi dikonfirmasi', async () => {
    const hasil = await updateBookingStatus(dibuat.bookingId!, 'confirmed', 'Sudah DP');
    expect(hasil.ok).toBe(true);

    const b = await getBookingById(dibuat.bookingId!);
    expect(b?.status).toBe('confirmed');
    expect(b?.adminNotes).toBe('Sudah DP');
  });

  it('harga pada pesanan tidak berubah walau tarif kendaraan dinaikkan', async () => {
    const sebelum = await getBookingById(dibuat.bookingId!);
    await db.update(vehicles).set({ rate24h: 9_000_000 }).where(eq(vehicles.id, dibuat.vehicleId!));

    const sesudah = await getBookingById(dibuat.bookingId!);
    expect(sesudah?.totalPrice).toBe(sebelum?.totalPrice);
  });

  it('menyajikan fasilitas dalam bahasa yang diminta, dengan jatuh-balik ke Indonesia', async () => {
    const { pickLocale } = await import('@/i18n/localized');
    const katalog = await getPublishedVehicles();
    const v = katalog.find((x) => x.id === dibuat.vehicleId);

    expect(pickLocale(v!.features, 'en')).toEqual(['Cold AC']);
    expect(pickLocale(v!.features, 'ko')).toEqual(['AC Dingin']);
    expect(pickLocale(v!.rentalTerms, 'zh')).toEqual(['Lepas kunci']);
  });

  it('menghapus kendaraan tidak menghapus riwayat pesanannya', async () => {
    await deleteVehicle(dibuat.vehicleId!);

    const b = await getBookingById(dibuat.bookingId!);
    expect(b).not.toBeNull();
    expect(b?.vehicleId).toBeNull();
    expect(b?.vehicleNameSnapshot).toContain('Uji Integrasi');
  });
});

afterAll(async () => {
  if (dibuat.bookingId) await db.delete(bookings).where(eq(bookings.id, dibuat.bookingId));
  if (dibuat.vehicleId) await db.delete(vehicles).where(eq(vehicles.id, dibuat.vehicleId));
});
```

- [ ] **Step 2: Jalankan tes integrasi**

Run: `npm test -- tests/integration/alur-penuh.test.ts`
Expected: PASS, 7 tes

Bila tes “harga tidak berubah” gagal, itu berarti halaman detail booking menghitung ulang dari tabel `vehicles` alih-alih membaca `priceBreakdown` — perbaiki di Task 16, jangan longgarkan tesnya.

- [ ] **Step 3: Jalankan seluruh rangkaian tes**

Run: `npm test`
Expected: seluruh berkas tes PASS

- [ ] **Step 4: Tulis README**

Create `README.md`:

```markdown
# LIANS — Website Rental Mobil Manado

Situs publik `lians.id` empat bahasa (Indonesia, Inggris, Mandarin, Korea) dan panel admin
`admin.lians.id` dalam satu aplikasi Next.js.

## Menjalankan secara lokal

    npm install
    cp .env.example .env.local   # isi DATABASE_URL, AUTH_SECRET, kunci Cloudinary
    npm run db:migrate
    npm run db:seed              # perlu SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD
    npm run dev

- Situs publik: http://localhost:3000 (Indonesia), `/en`, `/zh`, `/ko`
- Panel admin: http://admin.localhost:3000 (Indonesia saja)

## Perintah

| Perintah | Kegunaan |
|---|---|
| `npm run dev` | server pengembangan |
| `npm run build` | build produksi |
| `npm test` | seluruh tes |
| `npm run db:generate` | buat berkas migrasi dari perubahan skema |
| `npm run db:migrate` | terapkan migrasi |
| `npm run db:seed` | isi data awal dan akun admin pertama |

## Arsitektur

- `proxy.ts` mengarahkan `admin.*` ke grup rute `(admin)`, host lain ke `(public)/[locale]`
- `src/i18n/` memuat kamus keempat bahasa; kamus Indonesia adalah sumber kebenaran kunci, sehingga label yang lupa diterjemahkan menggagalkan build
- Terjemahan isi database disimpan sebagai `Localized<T>`; yang belum diisi jatuh ke bahasa Indonesia
- `src/queries/` membaca database, `src/actions/` menulis — setiap action admin memeriksa sesi sendiri
- `src/lib/pricing.ts` memuat seluruh logika harga sebagai fungsi murni, diuji dengan property-based testing
- Harga pesanan dibekukan saat pemesanan; perubahan tarif tidak mengubah riwayat

## Variabel lingkungan

Lihat `.env.example`. Semuanya wajib diisi di Vercel sebelum deploy.
```

- [ ] **Step 5: Siapkan konfigurasi Vercel**

Create `vercel.json`:

```json
{
  "buildCommand": "npm run db:migrate && npm run build",
  "framework": "nextjs",
  "regions": ["sin1"]
}
```

Region `sin1` (Singapura) adalah yang terdekat dengan Manado di antara wilayah Vercel — memangkas latensi dibanding wilayah bawaan di Amerika.

- [ ] **Step 6: Dorong ke GitHub**

```bash
gh repo create lians-web --private --source=. --remote=origin
git push -u origin main
```

- [ ] **Step 7: Deploy ke Vercel**

1. Buka https://vercel.com/new, impor repositori `lians-web`.
2. Isi Environment Variables (Production dan Preview) dari `.env.local`: `DATABASE_URL`, `AUTH_SECRET`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Atur `NEXT_PUBLIC_SITE_URL=https://lians.id` dan `AUTH_URL=https://admin.lians.id`.
4. Deploy.

Expected: build sukses, URL `*.vercel.app` menampilkan situs publik.

- [ ] **Step 8: Pasang domain**

Di Vercel → Settings → Domains, tambahkan `lians.id`, `www.lians.id`, dan `admin.lians.id`. Salin data DNS yang diminta ke panel registrar domain:

- `lians.id` → A record ke alamat IP yang Vercel berikan
- `www` → CNAME ke `cname.vercel-dns.com`
- `admin` → CNAME ke `cname.vercel-dns.com`

Expected: setelah DNS menyebar, `https://lians.id` menampilkan situs publik dan `https://admin.lians.id` menampilkan halaman login. Sertifikat TLS diterbitkan otomatis.

- [ ] **Step 9: Verifikasi produksi**

Periksa satu per satu:

1. `https://lians.id` memuat beranda dengan armada dari database
2. `https://lians.id/mobil/<slug>` memuat halaman detail
3. `https://lians.id/en`, `/zh`, `/ko` memuat versi bahasa masing-masing
4. Halaman detail memuat `hreflang` keempat bahasa plus `x-default`
5. `https://lians.id/sitemap.xml` memuat setiap URL kendaraan **empat kali**, sekali per bahasa
6. `https://lians.id/admin` mengembalikan 404
7. `https://admin.lians.id` mengalihkan ke halaman login
8. Login berhasil, ubah satu harga di admin, muat ulang halaman publik → harga baru tampil
9. Kirim satu pesanan uji dari `https://lians.id/ko/booking` → muncul di admin dengan pesan WhatsApp berbahasa Indonesia, lalu hapus

- [ ] **Step 10: Ganti logo penampung**

Ganti `public/logo-lians.png` dengan berkas logo LIANS sungguhan dari pemilik, lalu deploy ulang. Tanpa langkah ini situs tayang dengan logo sementara.

- [ ] **Step 11: Daftarkan ke Google**

1. Buka https://search.google.com/search-console, tambahkan properti `lians.id`, verifikasi lewat DNS.
2. Kirim `https://lians.id/sitemap.xml`.
3. Periksa laporan **International Targeting** setelah beberapa hari — Google melaporkan di sana bila ada `hreflang` yang tidak berbalasan.
4. Buat profil Google Business dengan alamat Jalan Pomorow — ini sumber trafik terbesar untuk rental mobil lokal, lebih besar daripada pencarian organik.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: tes integrasi alur penuh, README, dan konfigurasi Vercel"
git push
```

---

## Catatan Penutup

**Utang yang harus dilunasi sebelum peluncuran:**

1. Berkas logo LIANS sungguhan (Task 8 Step 15 memakai penampung sementara)
2. Foto armada asli — data seed sengaja dibuat tanpa foto
3. Nomor WhatsApp dan telepon LIANS yang benar di Pengaturan (nilai bawaan hanyalah contoh)
4. Teks halaman Tentang dalam keempat bahasa
5. Terjemahan Inggris, Mandarin, dan Korea untuk fasilitas & syarat sewa tiap kendaraan — situs tetap tayang tanpa ini karena jatuh-balik ke bahasa Indonesia, tetapi turis asing membaca teks Indonesia sampai diisi

**Keputusan yang sengaja ditunda** — tercatat di spesifikasi sebagai di luar cakupan: pembayaran online, pengecekan ketersediaan otomatis, akun customer, email otomatis, peran pengguna bertingkat, panel admin multibahasa, terjemahan otomatis, dan formulir ulasan publik.
