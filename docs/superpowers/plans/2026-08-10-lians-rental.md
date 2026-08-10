# LIANS Rental — Rencana Implementasi

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Membangun situs publik `lians.id` dan panel admin `admin.lians.id` untuk rental mobil LIANS Manado dalam satu aplikasi Next.js, dengan seluruh konten dikelola lewat CRUD di panel admin.

**Architecture:** Satu aplikasi Next.js 15 App Router. `middleware.ts` membaca hostname dan menulis-ulang `admin.*` ke grup rute `(admin)`, host lain ke `(public)`. Server Component membaca Postgres langsung lewat Drizzle tanpa lapisan REST internal; mutasi lewat Server Action yang memvalidasi dengan skema Zod yang sama dengan form di browser, lalu `revalidatePath`. Logika harga diisolasi sebagai fungsi murni tanpa ketergantungan React maupun database.

**Tech Stack:** Next.js 15 (App Router) · React 19 · TypeScript strict · Tailwind CSS 4 · shadcn/ui · Drizzle ORM · Neon Postgres · Auth.js v5 · Cloudinary · React Hook Form · Zod · date-fns · lucide-react · Vitest · Testing Library · fast-check

**Spesifikasi:** `docs/superpowers/specs/2026-08-10-lians-rental-design.md`

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Folder `../website-rental-mobil` adalah **referensi baca-saja** — jangan pernah diubah.
- Bahasa seluruh teks antarmuka: **Indonesia**. Mata uang **IDR**, diformat `Rp 350.000` (pemisah titik, tanpa desimal).
- TypeScript `strict: true`. Tidak ada `any` di kode produksi.
- Path alias `@/*` → `src/*`.
- Semua harga disimpan sebagai **integer rupiah**, tidak pernah float.
- Nama bisnis: **LIANS**. Alamat lengkap, dipakai persis: `Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125`.
- Warna aksen utama: `#2E8BF0` (biru logo LIANS). Tema terang — latar putih/abu netral, teks gelap.
- Hitungan hari sewa: `differenceInCalendarDays(endDate, startDate)`, minimum 1. Sewa 1 Agustus–3 Agustus = **2 hari**.
- Tarif sopir global di `siteSettings.driverFeePerDay`; `vehicles.driverFeeOverride` ada di skema tetapi selalu `null` pada rilis ini.
- Total harga **selalu** dihitung ulang di server; angka dari browser tidak pernah dipercaya.
- Commit setiap akhir tugas. Pesan commit berbahasa Indonesia, format `feat:` / `test:` / `chore:` / `fix:`.
- Rahasia (`DATABASE_URL`, `AUTH_SECRET`, kunci Cloudinary) hanya di `.env.local` dan environment variable Vercel — tidak pernah masuk repositori.

## Peta Berkas

```
lians-web/
├── drizzle.config.ts            konfigurasi drizzle-kit
├── middleware.ts                routing berbasis hostname + penjaga sesi admin
├── vitest.config.ts             jsdom + alias @/
├── src/
│   ├── app/
│   │   ├── layout.tsx           root: font, globals.css
│   │   ├── globals.css          token Tailwind 4 + palet LIANS
│   │   ├── (public)/            situs publik lians.id
│   │   ├── (admin)/admin/       panel admin.lians.id
│   │   ├── api/auth/[...nextauth]/route.ts
│   │   ├── sitemap.ts
│   │   └── robots.ts
│   ├── db/
│   │   ├── schema.ts            6 tabel + enum
│   │   ├── index.ts             koneksi Neon serverless
│   │   └── seed.ts              data awal + akun admin pertama
│   ├── lib/
│   │   ├── pricing.ts           fungsi murni harga  ← inti
│   │   ├── dates.ts             countRentalDays, format tanggal ID
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
│       └── admin/               DataTable, ImageUploader, form
└── tests/
    ├── unit/ properties/ components/ integration/
```

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

Create `vitest.config.ts`:

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
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

Create `tests/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
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

- [ ] **Step 13: Commit**

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

### Task 4: Skema database dan koneksi Neon

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
  features: jsonb('features').$type<string[]>().notNull().default([]),
  rentalTerms: jsonb('rental_terms').$type<string[]>().notNull().default([]),
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
  vehicleNote: text('vehicle_note'),
  estimatedDuration: text('estimated_duration'),
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
  reviewText: text('review_text').notNull(),
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

### Task 5: Skema Zod bersama dan tipe ActionResult

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
        code: z.ZodIssueCode.custom,
        path: ['startDate'],
        message: 'Tanggal mulai tidak boleh di masa lalu',
      });
    }

    if (data.serviceType === 'travel') return;

    const selesai = startOfDay(new Date(data.endDate));
    if (selesai < mulai) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['endDate'],
        message: 'Tanggal selesai harus setelah tanggal mulai',
      });
      return;
    }

    const jumlahHari = Math.max(1, differenceInCalendarDays(selesai, mulai));
    if (data.driverDays > jumlahHari) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['driverDays'],
        message: `Hari pakai sopir tidak boleh lebih dari ${jumlahHari} hari sewa`,
      });
    }
  });

export type BookingInput = z.infer<typeof bookingInputSchema>;
```

Catatan: aturan "paket 12 jam ditolak bila kendaraan tidak punya `rate12h`" tidak bisa ditegakkan di sini karena skema tidak melihat data kendaraan. Aturan itu ditegakkan di `calculateRentalPrice` (Task 3) dan diperiksa lagi di Server Action (Task 11).

- [ ] **Step 5: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: PASS, 11 tes

- [ ] **Step 6: Implementasi skema admin**

Create `src/schemas/vehicle.ts`:

```ts
import { z } from 'zod';

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
    features: z.array(z.string().trim().min(1)).default([]),
    rentalTerms: z.array(z.string().trim().min(1)).default([]),
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

export const routeInputSchema = z.object({
  origin: z.string().trim().min(2, 'Asal wajib diisi').max(100),
  destination: z.string().trim().min(2, 'Tujuan wajib diisi').max(100),
  price: z.coerce.number().int().min(0).nullable().default(null),
  vehicleNote: z.string().trim().max(100).nullable().default(null),
  estimatedDuration: z.string().trim().max(50).nullable().default(null),
  isPublished: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export type RouteInput = z.infer<typeof routeInputSchema>;
```

Create `src/schemas/testimonial.ts`:

```ts
import { z } from 'zod';

export const testimonialInputSchema = z.object({
  customerName: z.string().trim().min(2, 'Nama wajib diisi').max(100),
  rating: z.coerce.number().int().min(1).max(5),
  reviewText: z.string().trim().min(10, 'Ulasan minimal 10 karakter').max(500),
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

export const settingsInputSchema = z.object({
  whatsappNumber: z.string().regex(/^(\+62|62|0)8[1-9][0-9]{6,11}$/, 'Nomor WhatsApp tidak valid'),
  phone: z.string().trim().max(30),
  email: z.union([z.literal(''), z.string().email()]),
  address: z.string().trim().min(5),
  operatingHours: z.string().trim().max(200),
  mapsUrl: z.union([z.literal(''), z.string().url()]),
  heroTitle: z.string().trim().max(120),
  heroSubtitle: z.string().trim().max(300),
  aboutText: z.string().trim().max(4000),
  socialLinks: z
    .array(z.object({ label: z.string().trim().min(1), url: z.string().url() }))
    .default([]),
  promoBanner: z.string().trim().max(200),
  driverFeePerDay: z.coerce.number().int().min(0),
});

export type SettingsInput = z.infer<typeof settingsInputSchema>;
```

- [ ] **Step 7: Jalankan seluruh tes**

Run: `npm test`
Expected: PASS semua

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: skema Zod bersama dan tipe ActionResult"
```

---

### Task 6: Lapisan query dan data awal

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
  operatingHours: 'Setiap hari, 07.00 – 21.00 WITA',
  mapsUrl: '',
  heroTitle: 'Rental Mobil Terpercaya di Manado',
  heroSubtitle:
    'Lepas kunci, dengan sopir, bus pariwisata, dan antar-jemput bandara. Armada terawat, harga jelas.',
  aboutText: '',
  socialLinks: [],
  promoBanner: '',
  driverFeePerDay: 150000,
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

```ts
import 'dotenv/config';
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

const rute = [
  { origin: 'Manado', destination: 'Bandara Sam Ratulangi', price: 150000, estimatedDuration: '30 menit' },
  { origin: 'Manado', destination: 'Tomohon', price: 300000, estimatedDuration: '1 jam' },
  { origin: 'Manado', destination: 'Bitung', price: 400000, estimatedDuration: '1,5 jam' },
  { origin: 'Manado', destination: 'Likupang', price: null, estimatedDuration: '2 jam' },
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
      features: ['AC Dingin', 'Audio', 'Terawat'],
      rentalTerms:
        m.category === 'bus'
          ? ['Include driver', 'Durasi 12 jam', 'Area Manado dan sekitarnya']
          : ['Lepas kunci', 'Durasi 24 jam', 'Jaminan KTP + KK'],
      status: 'available' as const,
      isPublished: true,
      sortOrder: i,
    })),
  );

  await db.insert(travelRoutes).values(
    rute.map((r, i) => ({ ...r, vehicleNote: 'Avanza / Xenia', isPublished: true, sortOrder: i })),
  );

  await db.insert(testimonials).values([
    { customerName: 'Rina M.', rating: 5, reviewText: 'Mobil bersih dan tepat waktu. Sopirnya ramah, tahu jalan tikus Manado.', vehicleName: 'Innova Reborn', date: '2026-06-12', isFeatured: true, isPublished: true, sortOrder: 0 },
    { customerName: 'Dedi K.', rating: 5, reviewText: 'Proses cepat, harga sesuai yang disebut di awal. Tidak ada biaya tersembunyi.', vehicleName: 'Toyota Avanza', date: '2026-07-02', isFeatured: true, isPublished: true, sortOrder: 1 },
    { customerName: 'Grace L.', rating: 4, reviewText: 'Hiace-nya nyaman untuk rombongan keluarga ke Tomohon. Rekomendasi.', vehicleName: 'Hiace Commuter', date: '2026-07-20', isFeatured: true, isPublished: true, sortOrder: 2 },
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

### Task 7: Tema LIANS, layout publik, dan routing subdomain

**Files:**
- Create: `middleware.ts`, `src/app/globals.css`, `src/components/layout/Header.tsx`, `src/components/layout/Footer.tsx`, `src/components/layout/WhatsAppFloat.tsx`, `src/app/(public)/layout.tsx`, `src/app/(public)/error.tsx`, `src/app/(public)/not-found.tsx`, `src/lib/cn.ts`
- Move: `src/app/page.tsx` → `src/app/(public)/page.tsx`
- Test: `tests/components/layout.test.tsx`, `tests/unit/middleware.test.ts`

**Interfaces:**
- Consumes: `getSettings()` dari `@/queries/settings`, `formatRupiah` dari `@/lib/format`
- Produces:
  - `cn(...inputs: ClassValue[]): string` dari `@/lib/cn`
  - `<Header settings={SettingsInput} />`, `<Footer settings={SettingsInput} />` dari `@/components/layout`
  - `resolveHost(host: string, pathname: string): { kind: 'admin' | 'public' | 'blocked'; rewriteTo?: string }` dari `@/lib/host` — dipisah dari `middleware.ts` supaya bisa diuji tanpa runtime Next.js
  - Token CSS `--lians-blue`, kelas utilitas tema

- [ ] **Step 1: Tulis tes routing hostname yang gagal**

Create `tests/unit/middleware.test.ts`:

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

Run: `npm test -- tests/unit/middleware.test.ts`
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

Run: `npm test -- tests/unit/middleware.test.ts`
Expected: PASS, 6 tes

- [ ] **Step 5: Pasang middleware**

Create `middleware.ts` (di akar proyek, bukan di `src/`):

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { resolveHost } from '@/lib/host';

export function middleware(req: NextRequest) {
  const hasil = resolveHost(req.headers.get('host') ?? '', req.nextUrl.pathname);

  if (hasil.kind === 'blocked') {
    return new NextResponse('Halaman tidak ditemukan', { status: 404 });
  }
  if (hasil.kind === 'admin') {
    const url = req.nextUrl.clone();
    url.pathname = hasil.rewriteTo;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
```

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
    render(<Footer settings={DEFAULT_SETTINGS} />);
    expect(screen.getByText(/Pomorow/)).toBeInTheDocument();
    expect(screen.getByText(/Manado 95125/)).toBeInTheDocument();
  });

  it('menampilkan seluruh tautan navigasi utama', () => {
    render(<Footer settings={DEFAULT_SETTINGS} />);
    for (const label of ['Beranda', 'Kendaraan', 'Travel', 'Booking', 'Testimoni', 'Tentang', 'Kontak']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('menautkan WhatsApp ke nomor dari pengaturan', () => {
    render(<Footer settings={{ ...DEFAULT_SETTINGS, whatsappNumber: '081234567890' }} />);
    const tautan = screen.getByRole('link', { name: /whatsapp/i });
    expect(tautan).toHaveAttribute('href', expect.stringContaining('wa.me/6281234567890'));
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
export const NAV_ITEMS = [
  { href: '/', label: 'Beranda' },
  { href: '/mobil', label: 'Kendaraan' },
  { href: '/travel', label: 'Travel' },
  { href: '/booking', label: 'Booking' },
  { href: '/testimoni', label: 'Testimoni' },
  { href: '/tentang', label: 'Tentang' },
  { href: '/kontak', label: 'Kontak' },
] as const;
```

Create `src/components/layout/Footer.tsx`:

```tsx
import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import type { SettingsInput } from '@/schemas/settings';
import { normalizePhone } from '@/lib/whatsapp';
import { NAV_ITEMS } from './nav-items';

export function Footer({ settings }: { settings: SettingsInput }) {
  const tahun = new Date().getFullYear();
  const wa = normalizePhone(settings.whatsappNumber);

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <p className="text-xl font-black tracking-wide text-lians-600">LIANS</p>
          <p className="text-sm leading-relaxed text-muted">
            Rental mobil, bus pariwisata, dan antar-jemput bandara di Manado dan Sulawesi Utara.
          </p>
        </div>

        <nav aria-label="Navigasi footer" className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">Navigasi</h2>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-sm text-muted hover:text-lians-600">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">Hubungi</h2>
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
                WhatsApp
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
          <h2 className="text-sm font-bold uppercase tracking-wide">Jam Operasional</h2>
          <p className="flex gap-2 text-sm text-muted">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
            <span>{settings.operatingHours}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 py-5 text-center text-xs text-muted">
        © {tahun} LIANS. Seluruh hak cipta dilindungi.
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
import { NAV_ITEMS } from './nav-items';

export function Header({ whatsappUrl }: { whatsappUrl: string }) {
  const pathname = usePathname();
  const [terbuka, setTerbuka] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label="Beranda LIANS">
          <Image src="/logo-lians.png" alt="LIANS" width={120} height={32} priority />
        </Link>

        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname === item.href
                  ? 'bg-lians-50 text-lians-700'
                  : 'text-slate-600 hover:text-lians-600',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={whatsappUrl}
            className="hidden rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600 sm:inline-block"
          >
            Hubungi Kami
          </a>
          <button
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            aria-expanded={terbuka}
            aria-label={terbuka ? 'Tutup menu' : 'Buka menu'}
            className="rounded-lg p-2 lg:hidden"
          >
            {terbuka ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {terbuka ? (
        <nav aria-label="Navigasi seluler" className="border-t border-slate-200 lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setTerbuka(false)}
                  className="block py-3 text-sm font-medium text-slate-700"
                >
                  {item.label}
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

- [ ] **Step 11: Buat layout publik**

Create `src/app/(public)/layout.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { getSettings } from '@/queries/settings';
import { normalizePhone } from '@/lib/whatsapp';

export const revalidate = 300;

export default async function PublicLayout({ children }: { children: ReactNode }) {
  const settings = await getSettings();
  const whatsappUrl = `https://wa.me/${normalizePhone(settings.whatsappNumber)}`;

  return (
    <div className="flex min-h-screen flex-col">
      <Header whatsappUrl={whatsappUrl} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <WhatsAppFloat url={whatsappUrl} />
      <Toaster position="top-center" richColors />
    </div>
  );
}
```

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

Create `src/app/(public)/error.tsx`:

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

Create `src/app/(public)/not-found.tsx`:

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
mkdir -p "src/app/(public)"
git mv src/app/page.tsx "src/app/(public)/page.tsx"
```

- [ ] **Step 14: Simpan logo**

Salin berkas logo LIANS yang disediakan pemilik ke `public/logo-lians.png`. Bila belum tersedia, buat penampung sementara agar `next/image` tidak error, dan catat sebagai utang yang harus diganti sebelum peluncuran:

```bash
cp ../website-rental-mobil/public/favicon.svg public/logo-lians.png
```

- [ ] **Step 15: Jalankan tes dan build**

Run: `npm test -- tests/components/layout.test.tsx && npm run build`
Expected: PASS 3 tes, build sukses

- [ ] **Step 16: Verifikasi subdomain secara lokal**

Run: `npm run dev`, lalu buka `http://admin.localhost:3000`
Expected: menghasilkan 404 Next.js (rute `/admin` belum dibuat di Task 13) — bukan halaman publik. Ini membuktikan penulisan-ulang hostname bekerja.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "feat: tema LIANS, layout publik, dan routing subdomain"
```

---
### Task 8: Katalog kendaraan dengan pencarian, filter, dan pengurutan

**Files:**
- Create: `src/lib/vehicle-filter.ts`, `src/components/vehicle/VehicleCard.tsx`, `src/components/vehicle/VehicleGrid.tsx`, `src/components/vehicle/CatalogControls.tsx`, `src/app/(public)/mobil/page.tsx`
- Test: `tests/unit/vehicle-filter.test.ts`, `tests/components/vehicle.test.tsx`

**Interfaces:**
- Consumes: `getPublishedVehicles()` dari `@/queries/vehicles`, `formatRupiah`, `Vehicle` dari `@/db/schema`
- Produces:
  - `type CatalogFilters = { q?: string; category?: string; maxPrice?: number; sort?: 'harga-asc' | 'harga-desc' | 'nama-asc' }` dari `@/lib/vehicle-filter`
  - `filterAndSortVehicles(vehicles: Vehicle[], filters: CatalogFilters): Vehicle[]` dari `@/lib/vehicle-filter`
  - `parseCatalogFilters(params: Record<string, string | string[] | undefined>): CatalogFilters` dari `@/lib/vehicle-filter`
  - `<VehicleCard vehicle={Vehicle} />` dari `@/components/vehicle/VehicleCard`

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
    render(<VehicleCard vehicle={dasar} />);
    expect(screen.getByText('Innova Zenix G')).toBeInTheDocument();
    expect(screen.getByText(/Rp 900\.000/)).toBeInTheDocument();
  });

  it('menampilkan tarif 12 jam bila tersedia', () => {
    render(<VehicleCard vehicle={dasar} />);
    expect(screen.getByText(/Rp 650\.000/)).toBeInTheDocument();
  });

  it('menyembunyikan tarif 12 jam bila kendaraan tidak punya', () => {
    render(<VehicleCard vehicle={{ ...dasar, rate12h: null }} />);
    expect(screen.queryByText(/12 jam/i)).not.toBeInTheDocument();
  });

  it('menautkan ke halaman detail kendaraan', () => {
    render(<VehicleCard vehicle={dasar} />);
    expect(screen.getByRole('link', { name: /Innova Zenix G/ })).toHaveAttribute(
      'href',
      '/mobil/innova-zenix-g',
    );
  });

  it('menandai kendaraan yang sedang tidak tersedia', () => {
    render(<VehicleCard vehicle={{ ...dasar, status: 'unavailable' }} />);
    expect(screen.getByText(/sedang tersewa/i)).toBeInTheDocument();
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

const LABEL_KATEGORI: Record<string, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  mpv: 'MPV',
  luxury: 'Mewah',
  bus: 'Bus / Hiace',
};

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
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
            Foto menyusul
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-lians-700">
          {LABEL_KATEGORI[vehicle.category] ?? vehicle.category}
        </span>
        {!tersedia ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            Sedang tersewa
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <h3 className="text-lg font-bold">
          <Link href={`/mobil/${vehicle.slug}`} className="after:absolute after:inset-0">
            {vehicle.name}
          </Link>
        </h3>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden /> {vehicle.seats} kursi
          </li>
          <li className="flex items-center gap-1">
            <Cog className="h-3.5 w-3.5" aria-hidden />
            {vehicle.transmission === 'automatic' ? 'Matic' : 'Manual'}
          </li>
          <li className="flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5" aria-hidden /> {vehicle.year}
          </li>
          <li className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" aria-hidden /> {vehicle.luggage} koper
          </li>
        </ul>

        <div className="flex items-end justify-between border-t border-slate-100 pt-3">
          <div>
            <p className="text-lg font-black text-lians-600">{formatRupiah(vehicle.rate24h)}</p>
            <p className="text-xs text-muted">per 24 jam</p>
          </div>
          {vehicle.rate12h !== null ? (
            <div className="text-right">
              <p className="text-sm font-bold text-slate-700">{formatRupiah(vehicle.rate12h)}</p>
              <p className="text-xs text-muted">per 12 jam</p>
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
import { VehicleCard } from './VehicleCard';

export function VehicleGrid({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
        Tidak ada kendaraan yang cocok dengan pencarian Anda. Coba ubah filter atau hubungi kami
        lewat WhatsApp.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} vehicle={v} />
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

const KATEGORI = [
  { value: '', label: 'Semua kategori' },
  { value: 'hatchback', label: 'Hatchback' },
  { value: 'sedan', label: 'Sedan' },
  { value: 'suv', label: 'SUV' },
  { value: 'mpv', label: 'MPV' },
  { value: 'luxury', label: 'Mewah' },
  { value: 'bus', label: 'Bus / Hiace' },
];

const URUTAN = [
  { value: '', label: 'Urutan bawaan' },
  { value: 'harga-asc', label: 'Harga termurah' },
  { value: 'harga-desc', label: 'Harga termahal' },
  { value: 'nama-asc', label: 'Nama A–Z' },
];

const kelasInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lians-500 focus:outline-none focus:ring-2 focus:ring-lians-200';

export function CatalogControls({ filters }: { filters: CatalogFilters }) {
  return (
    <form method="get" className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="lg:col-span-2">
        <span className="mb-1 block text-xs font-semibold text-slate-600">Cari kendaraan</span>
        <input name="q" defaultValue={filters.q ?? ''} placeholder="Avanza, Innova…" className={kelasInput} />
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">Kategori</span>
        <select name="category" defaultValue={filters.category ?? ''} className={kelasInput}>
          {KATEGORI.map((k) => (
            <option key={k.value} value={k.value}>{k.label}</option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">Harga maksimum</span>
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
        <span className="mb-1 block text-xs font-semibold text-slate-600">Urutkan</span>
        <select name="sort" defaultValue={filters.sort ?? ''} className={kelasInput}>
          {URUTAN.map((u) => (
            <option key={u.value} value={u.value}>{u.label}</option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2 lg:col-span-5">
        <button type="submit" className="rounded-lg bg-lians-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lians-600">
          Terapkan filter
        </button>
      </div>
    </form>
  );
}
```

- [ ] **Step 10: Buat halaman katalog**

Create `src/app/(public)/mobil/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { filterAndSortVehicles, parseCatalogFilters } from '@/lib/vehicle-filter';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { CatalogControls } from '@/components/vehicle/CatalogControls';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Daftar Kendaraan Rental — LIANS Manado',
  description:
    'Pilihan armada rental mobil LIANS di Manado: hatchback, MPV, SUV, mobil mewah, dan Hiace pariwisata. Tarif 24 jam dan 12 jam.',
};

export default async function MobilPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseCatalogFilters(params);
  const semua = await getPublishedVehicles();
  const hasil = filterAndSortVehicles(semua, filters);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">Armada LIANS</h1>
        <p className="max-w-2xl text-muted">
          Semua kendaraan terawat dan siap jalan. Tarif sudah termasuk pajak, belum termasuk BBM dan
          biaya sopir.
        </p>
      </header>

      <CatalogControls filters={filters} />

      <p className="text-sm text-muted">
        Menampilkan {hasil.length} dari {semua.length} kendaraan
      </p>

      <VehicleGrid vehicles={hasil} />
    </div>
  );
}
```

- [ ] **Step 11: Jalankan seluruh tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: katalog kendaraan dengan pencarian, filter, dan pengurutan"
```

---
### Task 9: Halaman detail kendaraan, SEO, dan sitemap

**Files:**
- Create: `src/app/(public)/mobil/[slug]/page.tsx`, `src/components/vehicle/VehicleGallery.tsx`, `src/lib/seo.ts`, `src/app/sitemap.ts`, `src/app/robots.ts`
- Modify: `src/app/layout.tsx` (metadata dasar + font)
- Test: `tests/unit/seo.test.ts`

**Interfaces:**
- Consumes: `getVehicleBySlug`, `getPublishedVehicles`, `getSettings`
- Produces:
  - `buildAutoRentalJsonLd(args: { settings: SettingsInput; priceRange: string; url: string }): object` dari `@/lib/seo`
  - `buildVehicleJsonLd(args: { vehicle: Vehicle; url: string }): object` dari `@/lib/seo`
  - `SITE_URL: string` dari `@/lib/seo`

- [ ] **Step 1: Tulis tes SEO yang gagal**

Create `tests/unit/seo.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildAutoRentalJsonLd, buildVehicleJsonLd } from '@/lib/seo';
import { DEFAULT_SETTINGS } from '@/queries/settings';

describe('buildAutoRentalJsonLd', () => {
  const jsonLd = buildAutoRentalJsonLd({
    settings: DEFAULT_SETTINGS,
    priceRange: 'Rp 350.000 - Rp 2.500.000',
    url: 'https://lians.id',
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

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://lians.id';

export function buildAutoRentalJsonLd(args: {
  settings: SettingsInput;
  priceRange: string;
  url: string;
}) {
  const { settings, priceRange, url } = args;
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: 'LIANS',
    description: settings.heroSubtitle,
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
    openingHours: settings.operatingHours,
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

Create `src/app/(public)/mobil/[slug]/page.tsx`:

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Users, Cog, Fuel, Briefcase, Calendar } from 'lucide-react';
import { getPublishedVehicles, getVehicleBySlug } from '@/queries/vehicles';
import { getSettings } from '@/queries/settings';
import { formatRupiah } from '@/lib/format';
import { VehicleGallery } from '@/components/vehicle/VehicleGallery';
import { buildVehicleJsonLd, SITE_URL } from '@/lib/seo';
import { waLink } from '@/lib/whatsapp';

export const revalidate = 300;

export async function generateStaticParams() {
  const semua = await getPublishedVehicles();
  return semua.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: 'Kendaraan tidak ditemukan — LIANS' };

  const judul = `Sewa ${v.name} di Manado — ${formatRupiah(v.rate24h)}/24 jam | LIANS`;
  return {
    title: judul,
    description: `Rental ${v.name} tahun ${v.year}, ${v.seats} kursi, transmisi ${v.transmission === 'automatic' ? 'matic' : 'manual'}. Lepas kunci atau dengan sopir di Manado. Hubungi LIANS.`,
    alternates: { canonical: `${SITE_URL}/mobil/${v.slug}` },
    openGraph: {
      title: judul,
      images: v.images[0] ? [v.images[0].url] : [],
    },
  };
}

export default async function DetailMobilPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [vehicle, settings] = await Promise.all([getVehicleBySlug(slug), getSettings()]);

  if (!vehicle || !vehicle.isPublished) notFound();

  const tersedia = vehicle.status === 'available';
  const jsonLd = buildVehicleJsonLd({ vehicle, url: `${SITE_URL}/mobil/${vehicle.slug}` });
  const pesanWa = `Halo LIANS, saya ingin menanyakan ketersediaan ${vehicle.name}.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Remah roti" className="mb-6 text-sm text-muted">
        <Link href="/mobil" className="hover:text-lians-600">Kendaraan</Link>
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
                Sedang tersewa — hubungi kami untuk jadwal berikutnya
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-lians-200 bg-lians-50 p-4">
              <p className="text-xs font-semibold text-lians-700">Tarif 24 jam</p>
              <p className="text-2xl font-black text-lians-700">{formatRupiah(vehicle.rate24h)}</p>
            </div>
            {vehicle.rate12h !== null ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-600">Tarif 12 jam</p>
                <p className="text-2xl font-black">{formatRupiah(vehicle.rate12h)}</p>
              </div>
            ) : null}
          </div>

          <p className="text-sm text-muted">
            Biaya sopir {formatRupiah(vehicle.driverFeeOverride ?? settings.driverFeePerDay)} per
            hari, dihitung hanya untuk hari yang Anda pakai sopir.
          </p>

          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-3">
            {[
              { Icon: Users, label: 'Kapasitas', value: `${vehicle.seats} kursi` },
              { Icon: Cog, label: 'Transmisi', value: vehicle.transmission === 'automatic' ? 'Matic' : 'Manual' },
              { Icon: Fuel, label: 'Bahan bakar', value: vehicle.fuelType },
              { Icon: Calendar, label: 'Tahun', value: String(vehicle.year) },
              { Icon: Briefcase, label: 'Bagasi', value: `${vehicle.luggage} koper` },
            ].map(({ Icon, label, value }) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                </dt>
                <dd className="font-semibold capitalize">{value}</dd>
              </div>
            ))}
          </dl>

          {vehicle.features.length > 0 ? (
            <section>
              <h2 className="mb-2 font-bold">Fasilitas</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {vehicle.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-lians-500" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {vehicle.rentalTerms.length > 0 ? (
            <section>
              <h2 className="mb-2 font-bold">Syarat sewa</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">
                {vehicle.rentalTerms.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/booking?vehicle=${vehicle.slug}`}
              aria-disabled={!tersedia}
              className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Booking sekarang
            </Link>
            <a
              href={waLink(settings.whatsappNumber, pesanWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold hover:border-lians-400"
            >
              Tanya lewat WhatsApp
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
import { SITE_URL } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statis = ['', '/mobil', '/travel', '/booking', '/testimoni', '/tentang', '/kontak'].map(
    (p) => ({ url: `${SITE_URL}${p}`, lastModified: new Date(), priority: p === '' ? 1 : 0.8 }),
  );

  const kendaraan = (await getPublishedVehicles()).map((v) => ({
    url: `${SITE_URL}/mobil/${v.slug}`,
    lastModified: v.updatedAt,
    priority: 0.7,
  }));

  return [...statis, ...kendaraan];
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

Run: `npm run dev`, lalu buka `http://localhost:3000/mobil/innova-zenix-g`
Expected: halaman detail tampil dengan tarif 24 dan 12 jam, dan `curl -s localhost:3000/sitemap.xml` memuat URL kendaraan hasil seed.

- [ ] **Step 11: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: halaman detail kendaraan, JSON-LD, sitemap, dan robots"
```

---

### Task 10: Halaman travel

**Files:**
- Create: `src/components/travel/RouteCard.tsx`, `src/app/(public)/travel/page.tsx`
- Test: `tests/components/travel.test.tsx`

**Interfaces:**
- Consumes: `getPublishedRoutes()`, `getSettings()`, `waLink`, `formatRupiah`
- Produces: `<RouteCard route={TravelRoute} whatsappNumber={string} />` dari `@/components/travel/RouteCard`

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
  vehicleNote: 'Avanza / Xenia',
  estimatedDuration: '30 menit',
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as TravelRoute;

describe('RouteCard', () => {
  it('menampilkan asal dan tujuan', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" />);
    expect(screen.getByText(/Manado/)).toBeInTheDocument();
    expect(screen.getByText(/Bandara Sam Ratulangi/)).toBeInTheDocument();
  });

  it('menampilkan tarif dalam rupiah bila tersedia', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" />);
    expect(screen.getByText(/Rp 150\.000/)).toBeInTheDocument();
  });

  it('mengganti tarif dengan ajakan menghubungi bila harga belum ditetapkan', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" />);
    expect(screen.getByText(/hubungi untuk harga/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rp/)).not.toBeInTheDocument();
  });

  it('menautkan ke WhatsApp dengan pesan berisi nama rute', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" />);
    const tautan = screen.getByRole('link', { name: /hubungi untuk harga/i });
    expect(tautan.getAttribute('href')).toContain('wa.me/6281234567890');
    expect(decodeURIComponent(tautan.getAttribute('href') ?? '')).toContain('Bandara Sam Ratulangi');
  });

  it('menautkan ke form booking bila rute sudah bertarif', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" />);
    expect(screen.getByRole('link', { name: /pesan/i })).toHaveAttribute(
      'href',
      `/booking?route=${rute.id}`,
    );
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

export function RouteCard({
  route,
  whatsappNumber,
}: {
  route: TravelRoute;
  whatsappNumber: string;
}) {
  const pesan = `Halo LIANS, saya ingin menanyakan harga antar-jemput ${route.origin} ke ${route.destination}.`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 font-bold">
        <span>{route.origin}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
        <span>{route.destination}</span>
      </div>

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {route.estimatedDuration ? (
          <li className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" aria-hidden /> {route.estimatedDuration}
          </li>
        ) : null}
        {route.vehicleNote ? (
          <li className="flex items-center gap-1">
            <Car className="h-3.5 w-3.5" aria-hidden /> {route.vehicleNote}
          </li>
        ) : null}
      </ul>

      <div className="mt-auto border-t border-slate-100 pt-4">
        {route.price !== null ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-black text-lians-600">{formatRupiah(route.price)}</p>
              <p className="text-xs text-muted">sekali jalan, sudah termasuk sopir</p>
            </div>
            <Link
              href={`/booking?route=${route.id}`}
              className="rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
            >
              Pesan
            </Link>
          </div>
        ) : (
          <a
            href={waLink(whatsappNumber, pesan)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-lians-300 px-4 py-2 text-sm font-semibold text-lians-700 hover:bg-lians-50"
          >
            Hubungi untuk harga
          </a>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/travel.test.tsx`
Expected: PASS, 5 tes

- [ ] **Step 5: Buat halaman travel**

Create `src/app/(public)/travel/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { RouteCard } from '@/components/travel/RouteCard';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Antar-Jemput Bandara & Travel Manado — LIANS',
  description:
    'Layanan antar-jemput Bandara Sam Ratulangi dan travel antar kota di Sulawesi Utara. Tarif tetap sekali jalan, sudah termasuk sopir.',
};

export default async function TravelPage() {
  const [rute, settings] = await Promise.all([getPublishedRoutes(), getSettings()]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">Antar-Jemput & Travel</h1>
        <p className="max-w-2xl text-muted">
          Tarif berlaku sekali jalan dan sudah termasuk sopir serta BBM. Rute yang belum tercantum
          tarifnya bisa Anda tanyakan langsung lewat WhatsApp.
        </p>
      </header>

      {rute.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          Belum ada rute yang ditampilkan. Hubungi kami untuk menanyakan tujuan Anda.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rute.map((r) => (
            <RouteCard key={r.id} route={r} whatsappNumber={settings.whatsappNumber} />
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
### Task 11: Form booking, Server Action, dan pesan WhatsApp

Tugas terbesar dan paling penting di sisi publik. Di sinilah aturan "jangan pernah percaya harga dari browser" ditegakkan.

**Files:**
- Create: `src/lib/rate-limit.ts`, `src/actions/booking.ts`, `src/components/booking/BookingForm.tsx`, `src/components/booking/PriceSummary.tsx`, `src/app/(public)/booking/page.tsx`, `src/app/(public)/booking/sukses/page.tsx`
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
import { formatTanggalID } from '@/lib/dates';

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

export function buildBookingMessage(a: BookingMessageArgs): string {
  const baris: string[] = [
    `Halo LIANS, saya ingin konfirmasi pesanan.`,
    ``,
    `Kode: ${a.bookingCode}`,
    `Nama: ${a.customerName}`,
    `Pesanan: ${a.itemName}`,
    `Mulai: ${formatTanggalID(new Date(a.startDate))}`,
  ];

  if (a.endDate) baris.push(`Selesai: ${formatTanggalID(new Date(a.endDate))}`);
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

export function PriceSummary({
  breakdown,
  pesan,
}: {
  breakdown: PriceBreakdown | null;
  pesan?: string;
}) {
  if (!breakdown) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-muted">
        {pesan ?? 'Lengkapi pilihan kendaraan dan tanggal untuk melihat perkiraan harga.'}
      </div>
    );
  }

  const baris = [
    { label: `Sewa ${breakdown.days} hari × ${formatRupiah(breakdown.ratePerDay)}`, nilai: breakdown.rentalCost },
    ...(breakdown.driverDays > 0
      ? [{ label: `Sopir ${breakdown.driverDays} hari × ${formatRupiah(breakdown.driverFeePerDay)}`, nilai: breakdown.driverCost }]
      : []),
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-lians-200 bg-lians-50 p-5">
      <h2 className="font-bold">Perkiraan Biaya</h2>
      <dl className="space-y-2 text-sm">
        {baris.map((b) => (
          <div key={b.label} className="flex justify-between gap-3">
            <dt className="text-slate-600">{b.label}</dt>
            <dd className="font-medium">{formatRupiah(b.nilai)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between border-t border-lians-200 pt-3">
        <span className="font-bold">Total</span>
        <span className="text-xl font-black text-lians-700">{formatRupiah(breakdown.total)}</span>
      </div>
      <p className="text-xs text-muted">
        Belum termasuk BBM dan tol. Harga final dikonfirmasi lewat WhatsApp.
      </p>
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
}: {
  vehicles: BookingVehicleOption[];
  routes: BookingRouteOption[];
  driverFeePerDay: number;
  defaultVehicleSlug: string | null;
  defaultRouteId: string | null;
  onSubmit: SubmitFn;
}) {
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
            ? 'Rute ini belum bertarif tetap. Kami akan mengirimkan penawaran lewat WhatsApp.'
            : `Tarif sekali jalan ${formatRupiah(rutePilihan.price)}, sudah termasuk sopir dan BBM.`
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

    const pesan: Record<string, string> = {
      DRIVER_DAYS_EXCEEDS_DURATION: 'Hari pakai sopir tidak boleh lebih dari durasi sewa.',
      RATE_12H_UNAVAILABLE: 'Kendaraan ini tidak menyediakan paket 12 jam.',
      DRIVER_DAYS_NEGATIVE: 'Hari pakai sopir tidak boleh negatif.',
    };
    return { breakdown: null, pesanHarga: pesan[hasil.error] };
  }, [adalahTravel, rutePilihan, kendaraanTerpilih, nilai.startDate, nilai.endDate, nilai.rateType, nilai.driverDays, driverFeePerDay]);

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
    window.location.href = `/booking/sukses?kode=${hasil.data.bookingCode}&wa=${encodeURIComponent(hasil.data.whatsappUrl)}`;
  });

  return (
    <form onSubmit={kirim} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Jenis layanan</span>
          <select {...register('serviceType')} className={kelasInput}>
            <option value="self-drive">Lepas kunci</option>
            <option value="with-driver">Dengan sopir</option>
            <option value="tourism">Bus / Hiace pariwisata</option>
            <option value="travel">Antar-jemput / travel</option>
          </select>
        </label>

        {adalahTravel ? (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Rute</span>
            <select {...register('routeId', { required: true })} className={kelasInput}>
              <option value="">Pilih rute…</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                  {r.price === null ? ' — hubungi untuk harga' : ` — ${formatRupiah(r.price)}`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Kendaraan</span>
            <select {...register('vehicleId', { required: true })} className={kelasInput}>
              <option value="">Pilih kendaraan…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.status !== 'available'}>
                  {v.name} — {formatRupiah(v.rate24h)}/24 jam
                  {v.status !== 'available' ? ' (sedang tersewa)' : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Tanggal mulai</span>
            <input type="date" {...register('startDate', { required: true })} className={kelasInput} />
          </label>

          {!adalahTravel ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">Tanggal selesai</span>
              <input type="date" {...register('endDate', { required: true })} className={kelasInput} />
            </label>
          ) : null}
        </div>

        {!adalahTravel && kendaraanTerpilih?.rate12h !== null && kendaraanTerpilih ? (
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">Paket tarif</legend>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="24h" {...register('rateType')} /> 24 jam (
                {formatRupiah(kendaraanTerpilih.rate24h)})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="12h" {...register('rateType')} /> 12 jam (
                {formatRupiah(kendaraanTerpilih.rate12h)})
              </label>
            </div>
          </fieldset>
        ) : null}

        {!adalahTravel ? (
          <label className="block max-w-xs">
            <span className="mb-1 block text-sm font-semibold">Hari pakai sopir</span>
            <input
              type="number"
              min={0}
              max={jumlahHari ?? undefined}
              {...register('driverDays', { valueAsNumber: true })}
              className={kelasInput}
            />
            <span className="mt-1 block text-xs text-muted">
              Boleh lebih sedikit dari durasi sewa. Isi 0 bila tanpa sopir.
              {jumlahHari !== null ? ` Maksimum ${jumlahHari} hari.` : ''}
            </span>
            {sopirBerlebih ? (
              <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
                Hari pakai sopir tidak boleh lebih dari {jumlahHari} hari sewa.
              </span>
            ) : null}
          </label>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Nama lengkap</span>
            <input {...register('customerName', { required: true })} className={kelasInput} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
            <input {...register('phone', { required: true })} placeholder="081234567890" className={kelasInput} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Email (opsional)</span>
          <input type="email" {...register('email')} className={kelasInput} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Catatan (opsional)</span>
          <textarea rows={3} {...register('notes')} placeholder="Lokasi penjemputan, permintaan khusus…" className={kelasInput} />
        </label>

        <button
          type="submit"
          disabled={mengirim || sopirBerlebih || formState.isSubmitting}
          className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
        >
          {mengirim ? 'Mengirim…' : 'Kirim pesanan'}
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PriceSummary breakdown={breakdown} pesan={pesanHarga} />
      </aside>
    </form>
  );
}
```

- [ ] **Step 11: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/booking-form.test.tsx`
Expected: PASS, 5 tes

- [ ] **Step 12: Buat halaman booking dan halaman sukses**

Create `src/app/(public)/booking/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { BookingForm } from '@/components/booking/BookingForm';
import { createBooking } from '@/actions/booking';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Booking Rental Mobil — LIANS Manado',
  description: 'Isi formulir pemesanan rental mobil LIANS. Konfirmasi cepat lewat WhatsApp.',
};

export default async function BookingPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string; route?: string }>;
}) {
  const params = await searchParams;
  const [vehicles, routes, settings] = await Promise.all([
    getPublishedVehicles(),
    getPublishedRoutes(),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">Booking Kendaraan</h1>
        <p className="max-w-2xl text-muted">
          Pesanan Anda langsung tercatat di sistem kami, lalu WhatsApp terbuka berisi ringkasannya.
          Tim LIANS akan mengonfirmasi ketersediaan.
        </p>
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
        defaultVehicleSlug={params.vehicle ?? null}
        defaultRouteId={params.route ?? null}
        onSubmit={createBooking}
      />
    </div>
  );
}
```

Create `src/app/(public)/booking/sukses/page.tsx`:

```tsx
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const metadata = { title: 'Pesanan Terkirim — LIANS' };

export default async function SuksesPage({
  searchParams,
}: {
  searchParams: Promise<{ kode?: string; wa?: string }>;
}) {
  const { kode, wa } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden />
      <h1 className="mt-4 text-2xl font-black">Pesanan Anda tercatat</h1>
      <p className="mt-2 text-muted">
        Kode pesanan Anda <strong className="text-ink">{kode ?? '-'}</strong>. Simpan kode ini untuk
        memudahkan komunikasi dengan tim kami.
      </p>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
        >
          Lanjutkan ke WhatsApp
        </a>
      ) : null}

      <p className="mt-8 text-sm text-muted">
        Belum sempat mengirim chat? Tidak apa-apa — pesanan Anda sudah masuk dan tim kami akan
        menghubungi Anda.
      </p>

      <Link href="/mobil" className="mt-4 inline-block text-sm font-semibold text-lians-600">
        Lihat kendaraan lain
      </Link>
    </div>
  );
}
```

- [ ] **Step 13: Verifikasi alur booking secara manual**

Run: `npm run dev`, buka `http://localhost:3000/booking?vehicle=innova-zenix-g`, isi 5 hari dengan sopir 3 hari, lalu kirim.
Expected: halaman sukses menampilkan kode `LNS-…`, dan baris baru muncul di tabel `bookings` dengan `total_price` sesuai `5 × 900000 + 3 × 150000 = 4.950.000`.

- [ ] **Step 14: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 15: Commit**

```bash
git add -A
git commit -m "feat: form booking, Server Action, pembatas laju, dan pesan WhatsApp"
```

---
### Task 12: Beranda, testimoni, tentang, dan kontak

**Files:**
- Create: `src/components/testimonial/TestimonialCard.tsx`, `src/components/home/Hero.tsx`, `src/components/home/ServiceCards.tsx`, `src/app/(public)/testimoni/page.tsx`, `src/app/(public)/tentang/page.tsx`, `src/app/(public)/kontak/page.tsx`
- Modify: `src/app/(public)/page.tsx` (beranda penuh)
- Test: `tests/components/testimonial.test.tsx`

**Interfaces:**
- Consumes: `getFeaturedVehicles`, `getPublishedRoutes`, `getFeaturedTestimonials`, `getPublishedTestimonials`, `getSettings`, `buildAutoRentalJsonLd`, `formatRupiah`
- Produces: `<TestimonialCard testimonial={Testimonial} />` dari `@/components/testimonial/TestimonialCard`

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
  reviewText: 'Mobil bersih dan tepat waktu.',
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
    render(<TestimonialCard testimonial={testimoni} />);
    expect(screen.getByText('Rina M.')).toBeInTheDocument();
    expect(screen.getByText(/Mobil bersih/)).toBeInTheDocument();
    expect(screen.getByText(/Innova Reborn/)).toBeInTheDocument();
  });

  it('menyatakan rating sebagai teks yang bisa dibaca pembaca layar', () => {
    render(<TestimonialCard testimonial={testimoni} />);
    expect(screen.getByLabelText('Rating 5 dari 5')).toBeInTheDocument();
  });

  it('menampilkan tanggal dalam format Indonesia', () => {
    render(<TestimonialCard testimonial={testimoni} />);
    expect(screen.getByText('12 Juni 2026')).toBeInTheDocument();
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
import { formatTanggalID } from '@/lib/dates';
import { cn } from '@/lib/cn';

export function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <figure className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div
        role="img"
        aria-label={`Rating ${testimonial.rating} dari 5`}
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

      <blockquote className="flex-1 text-sm leading-relaxed text-slate-700">
        “{testimonial.reviewText}”
      </blockquote>

      <figcaption className="border-t border-slate-100 pt-3 text-sm">
        <span className="font-semibold">{testimonial.customerName}</span>
        {testimonial.vehicleName ? (
          <span className="block text-xs text-muted">{testimonial.vehicleName}</span>
        ) : null}
        <span className="block text-xs text-muted">
          {formatTanggalID(new Date(testimonial.date))}
        </span>
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Jalankan tes, pastikan lulus**

Run: `npm test -- tests/components/testimonial.test.tsx`
Expected: PASS, 3 tes

- [ ] **Step 5: Buat hero dan kartu layanan**

Create `src/components/home/Hero.tsx`:

```tsx
import Link from 'next/link';
import { MapPin } from 'lucide-react';

export function Hero({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-lians-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-lians-700 shadow-sm">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> Melayani Manado & Sulawesi Utara
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">{subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/mobil" className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600">
            Lihat armada
          </Link>
          <Link href="/booking" className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold hover:border-lians-400">
            Booking sekarang
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

const LAYANAN = [
  { Icon: Key, title: 'Lepas Kunci', desc: 'Bawa sendiri, bebas ke mana saja. Tarif 24 jam atau 12 jam.', href: '/mobil' },
  { Icon: UserRound, title: 'Dengan Sopir', desc: 'Sopir berpengalaman yang hafal jalanan Manado.', href: '/booking' },
  { Icon: Bus, title: 'Bus & Hiace Pariwisata', desc: 'Rombongan keluarga, kantor, atau wisata sekolah.', href: '/mobil?category=bus' },
  { Icon: PlaneTakeoff, title: 'Antar-Jemput Bandara', desc: 'Tarif tetap sekali jalan ke Sam Ratulangi dan sekitarnya.', href: '/travel' },
];

export function ServiceCards() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-black sm:text-3xl">Layanan Kami</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {LAYANAN.map(({ Icon, title, desc, href }) => (
          <Link
            key={title}
            href={href}
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

Replace `src/app/(public)/page.tsx`:

```tsx
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
import { buildAutoRentalJsonLd, SITE_URL } from '@/lib/seo';
import { formatRupiah } from '@/lib/format';

export const revalidate = 300;

export default async function BerandaPage() {
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

  const jsonLd = buildAutoRentalJsonLd({ settings, priceRange, url: SITE_URL });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} />

      {settings.promoBanner ? (
        <p className="bg-lians-600 px-4 py-3 text-center text-sm font-semibold text-white">
          {settings.promoBanner}
        </p>
      ) : null}

      <ServiceCards />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black sm:text-3xl">Armada Pilihan</h2>
          <Link href="/mobil" className="text-sm font-semibold text-lians-600">
            Lihat semua →
          </Link>
        </div>
        <VehicleGrid vehicles={kendaraan} />
      </section>

      {rute.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black sm:text-3xl">Rute Antar-Jemput</h2>
            <Link href="/travel" className="text-sm font-semibold text-lians-600">
              Lihat semua →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rute.slice(0, 3).map((r) => (
              <RouteCard key={r.id} route={r} whatsappNumber={settings.whatsappNumber} />
            ))}
          </div>
        </section>
      ) : null}

      {testimoni.length > 0 ? (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black sm:text-3xl">Kata Pelanggan</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimoni.map((t) => (
                <TestimonialCard key={t.id} testimonial={t} />
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

Create `src/app/(public)/testimoni/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getPublishedTestimonials } from '@/queries/testimonials';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Testimoni Pelanggan — LIANS Manado',
  description: 'Pengalaman pelanggan yang telah menyewa mobil di LIANS Manado.',
};

export default async function TestimoniPage() {
  const semua = await getPublishedTestimonials();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">Testimoni Pelanggan</h1>
        <p className="max-w-2xl text-muted">Apa kata mereka yang sudah menyewa di LIANS.</p>
      </header>

      {semua.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          Belum ada testimoni yang ditampilkan.
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {semua.map((t) => (
            <TestimonialCard key={t.id} testimonial={t} />
          ))}
        </div>
      )}
    </div>
  );
}
```

Create `src/app/(public)/tentang/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { getSettings } from '@/queries/settings';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Tentang LIANS — Rental Mobil Manado',
  description: 'Profil LIANS, penyedia rental mobil dan antar-jemput di Manado, Sulawesi Utara.',
};

export default async function TentangPage() {
  const settings = await getSettings();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-black sm:text-4xl">Tentang LIANS</h1>

      {settings.aboutText ? (
        settings.aboutText.split('\n\n').map((paragraf, i) => (
          <p key={i} className="leading-relaxed text-slate-700">
            {paragraf}
          </p>
        ))
      ) : (
        <p className="leading-relaxed text-slate-700">
          LIANS melayani rental mobil lepas kunci dan dengan sopir, bus serta Hiace pariwisata, dan
          antar-jemput bandara di Manado dan sekitarnya. Kantor kami berada di {settings.address}.
        </p>
      )}
    </div>
  );
}
```

Create `src/app/(public)/kontak/page.tsx`:

```tsx
import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { getSettings } from '@/queries/settings';
import { waLink } from '@/lib/whatsapp';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'Kontak LIANS — Jalan Pomorow, Manado',
  description:
    'Hubungi LIANS di Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125.',
};

export default async function KontakPage() {
  const settings = await getSettings();
  const petaSrc = `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black sm:text-4xl">Hubungi Kami</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <ul className="space-y-5">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">Alamat</p>
              <p className="text-sm text-muted">{settings.address}</p>
            </div>
          </li>
          <li className="flex gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">WhatsApp</p>
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
              <p className="font-semibold">Telepon</p>
              <a href={`tel:${settings.phone}`} className="text-sm text-lians-600">
                {settings.phone}
              </a>
            </div>
          </li>
          {settings.email ? (
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
              <div>
                <p className="font-semibold">Email</p>
                <a href={`mailto:${settings.email}`} className="text-sm text-lians-600">
                  {settings.email}
                </a>
              </div>
            </li>
          ) : null}
          <li className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">Jam Operasional</p>
              <p className="text-sm text-muted">{settings.operatingHours}</p>
            </div>
          </li>
        </ul>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <iframe
            title="Lokasi LIANS di Google Maps"
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

### Task 13: Autentikasi dan halaman login

**Catatan penyimpangan dari spesifikasi.** Spesifikasi menyebut panel admin dijaga middleware Auth.js. Rencana ini menaruh penjaga sesi di layout admin, bukan di middleware, karena `bcryptjs` tidak dapat berjalan di Edge Runtime tempat middleware Next.js dieksekusi. Middleware tetap menangani penulisan-ulang hostname. Lapisan keamanannya menjadi: layout admin memeriksa sesi, dan setiap Server Action admin memeriksa sesinya sendiri — sehingga permintaan langsung ke action tetap tertolak walau seseorang melewati halaman.

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

Tambahkan kasus uji ke `tests/unit/middleware.test.ts`:

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
import { formatTanggalID } from '@/lib/dates';

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
                      {b.bookingCode} · {formatTanggalID(new Date(b.startDate))}
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

- [ ] **Step 12: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua (termasuk 8 tes middleware), build sukses

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: autentikasi admin, login, dan dasbor"
```

---
### Task 14: CRUD armada dan unggah foto Cloudinary

**Files:**
- Create: `src/lib/cloudinary.ts`, `src/actions/upload.ts`, `src/actions/admin-vehicles.ts`, `src/components/admin/ImageUploader.tsx`, `src/components/admin/VehicleForm.tsx`, `src/components/admin/StringListInput.tsx`, `src/app/(admin)/admin/armada/page.tsx`, `src/app/(admin)/admin/armada/baru/page.tsx`, `src/app/(admin)/admin/armada/[id]/page.tsx`
- Test: `tests/unit/slug-unik.test.ts`

**Interfaces:**
- Consumes: `requireSession`, `vehicleInputSchema`, `slugify`, `getAllVehicles`, `getVehicleById`, `ok`/`fail`
- Produces:
  - `getUploadSignature(): Promise<ActionResult<{ signature: string; timestamp: number; apiKey: string; cloudName: string; folder: string }>>` dari `@/actions/upload`
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

- [ ] **Step 9: Buat input daftar teks dan form kendaraan**

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
import { ImageUploader } from './ImageUploader';
import { StringListInput } from './StringListInput';

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
  const [features, setFeatures] = useState<string[]>(vehicle?.features ?? []);
  const [rentalTerms, setRentalTerms] = useState<string[]>(vehicle?.rentalTerms ?? []);
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

      <StringListInput label="Fasilitas" values={features} placeholder="AC Dingin" onChange={setFeatures} />
      <StringListInput label="Syarat sewa" values={rentalTerms} placeholder="Jaminan KTP + KK" onChange={setRentalTerms} />

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

- [ ] **Step 10: Buat halaman daftar, tambah, dan ubah armada**

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

- [ ] **Step 11: Verifikasi CRUD armada secara manual**

Run: `npm run dev`, buka `http://admin.localhost:3000/armada/baru`
Expected: tambah kendaraan baru dengan satu foto → tersimpan → muncul di `http://localhost:3000/mobil` tanpa restart server.

- [ ] **Step 12: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: CRUD armada dan unggah foto Cloudinary"
```

---

### Task 15: CRUD booking, rute, testimoni, dan pengaturan

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
import { formatTanggalID } from '@/lib/dates';

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
                <td className="p-4">{formatTanggalID(new Date(b.startDate))}</td>
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
import { formatTanggalID } from '@/lib/dates';
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
            ['Mulai', formatTanggalID(new Date(b.startDate))],
            ['Selesai', b.endDate ? formatTanggalID(new Date(b.endDate)) : '—'],
            ['Paket tarif', b.rateType ? `${b.rateType === '12h' ? '12' : '24'} jam` : '—'],
            ['Hari pakai sopir', String(b.driverDays)],
            ['Catatan customer', b.notes ?? '—'],
            ['Dibuat', formatTanggalID(new Date(b.createdAt))],
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

type Values = {
  origin: string;
  destination: string;
  price: number | '';
  vehicleNote: string;
  estimatedDuration: string;
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
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      origin: route?.origin ?? 'Manado',
      destination: route?.destination ?? '',
      price: route?.price ?? '',
      vehicleNote: route?.vehicleNote ?? '',
      estimatedDuration: route?.estimatedDuration ?? '',
      isPublished: route?.isPublished ?? true,
      sortOrder: route?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      price: v.price === '' ? null : Number(v.price),
      vehicleNote: v.vehicleNote || null,
      estimatedDuration: v.estimatedDuration || null,
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
          <span className="mb-1 block text-sm font-semibold">Catatan kendaraan</span>
          <input {...register('vehicleNote')} placeholder="Avanza / Xenia" className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Perkiraan waktu tempuh</span>
          <input {...register('estimatedDuration')} placeholder="45 menit" className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Urutan tampil</span>
          <input type="number" {...register('sortOrder', { valueAsNumber: true })} className={kelas} />
        </label>
      </div>

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

Create `src/components/admin/TestimonialForm.tsx` dengan pola identik, berisi `customerName`, `rating` (select 1–5), `reviewText` (textarea, maks 500), `vehicleName`, `date` (input tanggal), `isFeatured`, `isPublished`, `sortOrder`; arahkan ke `/testimoni` saat sukses.

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

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function SettingsForm({
  settings,
  onSubmit,
}: {
  settings: SettingsInput;
  onSubmit: (input: unknown) => Promise<ActionResult<{ ok: true }>>;
}) {
  const [menyimpan, setMenyimpan] = useState(false);
  const { register, handleSubmit } = useForm<SettingsInput>({ defaultValues: settings });

  const kirim = handleSubmit(async (v) => {
    setMenyimpan(true);
    const hasil = await onSubmit({ ...v, socialLinks: settings.socialLinks });
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
        <label>
          <span className="mb-1 block text-sm font-semibold">Jam operasional</span>
          <input {...register('operatingHours')} className={kelas} />
        </label>
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

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Teks halaman</h2>
        <label>
          <span className="mb-1 block text-sm font-semibold">Judul hero</span>
          <input {...register('heroTitle')} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Subjudul hero</span>
          <textarea rows={2} {...register('heroSubtitle')} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Banner promo</span>
          <input {...register('promoBanner')} placeholder="Diskon 10% sewa mingguan" className={kelas} />
          <span className="mt-1 block text-xs text-muted">Kosongkan untuk menyembunyikan banner.</span>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Teks halaman Tentang</span>
          <textarea rows={8} {...register('aboutText')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">Pisahkan paragraf dengan satu baris kosong.</span>
        </label>
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
2. Tambah rute tanpa tarif → muncul di `/travel` dengan tombol “Hubungi untuk harga”.
3. Ubah status satu booking jadi `confirmed` → hitungan “Menunggu konfirmasi” di dasbor berkurang.

- [ ] **Step 12: Jalankan tes dan build**

Run: `npm test && npm run build`
Expected: PASS semua, build sukses

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: CRUD booking, rute travel, testimoni, pengaturan situs, dan akun staf"
```

---

### Task 16: Tes integrasi alur penuh dan penerbitan

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
      features: [],
      rentalTerms: [],
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
Expected: PASS, 6 tes

Bila tes “harga tidak berubah” gagal, itu berarti halaman detail booking menghitung ulang dari tabel `vehicles` alih-alih membaca `priceBreakdown` — perbaiki di Task 15, jangan longgarkan tesnya.

- [ ] **Step 3: Jalankan seluruh rangkaian tes**

Run: `npm test`
Expected: seluruh berkas tes PASS

- [ ] **Step 4: Tulis README**

Create `README.md`:

```markdown
# LIANS — Website Rental Mobil Manado

Situs publik `lians.id` dan panel admin `admin.lians.id` dalam satu aplikasi Next.js.

## Menjalankan secara lokal

    npm install
    cp .env.example .env.local   # isi DATABASE_URL, AUTH_SECRET, kunci Cloudinary
    npm run db:migrate
    npm run db:seed              # perlu SEED_ADMIN_EMAIL dan SEED_ADMIN_PASSWORD
    npm run dev

- Situs publik: http://localhost:3000
- Panel admin: http://admin.localhost:3000

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

- `middleware.ts` mengarahkan `admin.*` ke grup rute `(admin)`, host lain ke `(public)`
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
3. `https://lians.id/sitemap.xml` memuat seluruh URL kendaraan
4. `https://lians.id/admin` mengembalikan 404
5. `https://admin.lians.id` mengalihkan ke halaman login
6. Login berhasil, ubah satu harga di admin, muat ulang halaman publik → harga baru tampil
7. Kirim satu pesanan uji dari `https://lians.id/booking` → muncul di admin, lalu hapus

- [ ] **Step 10: Ganti logo penampung**

Ganti `public/logo-lians.png` dengan berkas logo LIANS sungguhan dari pemilik, lalu deploy ulang. Tanpa langkah ini situs tayang dengan logo sementara.

- [ ] **Step 11: Daftarkan ke Google**

1. Buka https://search.google.com/search-console, tambahkan properti `lians.id`, verifikasi lewat DNS.
2. Kirim `https://lians.id/sitemap.xml`.
3. Buat profil Google Business dengan alamat Jalan Pomorow — ini sumber trafik terbesar untuk rental mobil lokal, lebih besar daripada pencarian organik.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "chore: tes integrasi alur penuh, README, dan konfigurasi Vercel"
git push
```

---

## Catatan Penutup

**Utang yang harus dilunasi sebelum peluncuran:**

1. Berkas logo LIANS sungguhan (Task 7 Step 14 memakai penampung sementara)
2. Foto armada asli — data seed sengaja dibuat tanpa foto
3. Nomor WhatsApp dan telepon LIANS yang benar di Pengaturan (nilai bawaan hanyalah contoh)
4. Teks halaman Tentang

**Keputusan yang sengaja ditunda** — tercatat di spesifikasi sebagai di luar cakupan: pembayaran online, pengecekan ketersediaan otomatis, akun customer, email otomatis, peran pengguna bertingkat, versi bahasa Inggris, dan formulir ulasan publik.
