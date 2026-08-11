# Tahap 2A — Model Harga Dua Kategori dan Menu Baru

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti model harga 24 jam/12 jam berikut seluruh logika hari sopir dengan dua kategori per hari — Lepas Kunci dan Pelayanan — dengan hitungan hari inklusif, tanpa merusak pesanan yang sudah tersimpan.

**Architecture:** Perubahan bergerak dari dalam ke luar: fungsi harga murni lebih dulu, lalu skema database, skema validasi, alur booking, tampilan publik, panel admin, dan terakhir menu. Kolom lama pada tabel `bookings` dipertahankan agar pesanan Fase 1 tetap terbaca; kolom baru menampung pesanan berikutnya.

**Tech Stack:** Next.js 16 · TypeScript strict · Drizzle ORM · Neon Postgres · Zod 4 · Vitest · fast-check

**Spesifikasi:** `docs/superpowers/specs/2026-08-11-lians-fase-2-design.md` (Tahap 2A)

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Situs **sedang tayang** di `lians.id` dan menerima pesanan sungguhan.
- Bahasa antarmuka publik: Indonesia (bawaan), Inggris, Mandarin, Korea. Panel admin: Indonesia saja.
- Harga integer rupiah. Mata uang IDR di semua bahasa.
- **Hitungan hari inklusif:** `differenceInCalendarDays(end, start) + 1`, minimum 1. Sewa 15–17 Agustus = **3 hari**. Sewa tanggal yang sama = **1 hari**.
- Dua kategori: `lepas-kunci` (kendaraan saja) dan `pelayanan` (kendaraan + pengemudi + BBM). Satu kategori untuk seluruh sewa.
- **Pesanan Fase 1 wajib tetap terbaca** tanpa error di panel admin, dengan rincian lamanya apa adanya.
- Total harga selalu dihitung ulang di server; angka dari browser tidak pernah dipercaya.
- TypeScript `strict`, tanpa `any` di kode produksi. Path alias `@/*` → `src/*`.
- Commit tiap akhir tugas, pesan berbahasa Indonesia.
- **Menu tumbuh bertahap.** Tahap 2A tidak memasang Ticketing, Tours, dan Terms karena halamannya belum ada — memasang tautan ke 404 pada situs yang sedang tayang tidak dapat diterima. Ketiganya menyusul bersama halamannya di Tahap 2C dan 2D.

## Peta Berkas

```
src/lib/pricing.ts          ← ditulis ulang; jantung perubahan
src/lib/dates.ts            ← countRentalDays jadi inklusif
src/lib/vehicle-rate.ts     ← BARU: tarif tampil & tarif terendah
src/db/schema.ts            ← kolom baru, kolom lama dipertahankan
src/schemas/booking.ts      ← rateCategory menggantikan rateType+driverDays
src/schemas/vehicle.ts      ← dua tarif menggantikan rate24h/rate12h
src/schemas/settings.ts     ← driverFeePerDay dihapus
src/actions/booking.ts      ← hitung ulang dengan kategori
src/components/booking/     ← form dan ringkasan harga
src/components/vehicle/     ← kartu katalog
src/components/admin/       ← form kendaraan, form pengaturan
src/app/[locale]/mobil/     ← katalog dan detail
src/app/admin/booking/[id]/ ← harus membaca rincian lama DAN baru
src/components/layout/      ← menu
```

---

### Task 1: Fungsi harga dua kategori

Jantung perubahan. Dikerjakan lebih dulu supaya sisanya menyesuaikan bentuk yang sudah pasti.

**Files:**
- Modify: `src/lib/dates.ts`, `src/lib/pricing.ts`
- Test: `tests/unit/dates.test.ts`, `tests/unit/pricing.test.ts`, `tests/properties/pricing.properties.test.ts`

**Interfaces:**
- Consumes: `differenceInCalendarDays` dari date-fns
- Produces, dari `@/lib/pricing`:
  - `type RateCategory = 'lepas-kunci' | 'pelayanan'`
  - `type VehiclePricing = { rateLepasKunci: number | null; ratePelayanan: number | null }`
  - `type RentalPriceInput = { vehicle: VehiclePricing; startDate: Date; endDate: Date; category: RateCategory }`
  - `type PriceBreakdown = { days: number; category: RateCategory; ratePerDay: number; total: number }`
  - `type PricingError = 'CATEGORY_UNAVAILABLE' | 'END_BEFORE_START'`
  - `type PricingResult = { ok: true; breakdown: PriceBreakdown } | { ok: false; error: PricingError }`
  - `calculateRentalPrice(input: RentalPriceInput): PricingResult`
  - `calculateTravelPrice(routePrice: number | null): number | null` (tidak berubah)
- Dari `@/lib/dates`: `countRentalDays(start, end)` kini inklusif

- [ ] **Step 1: Ubah tes tanggal ke aturan inklusif**

Ganti blok `countRentalDays` di `tests/unit/dates.test.ts`:

```ts
describe('countRentalDays', () => {
  it('menghitung 15 sampai 17 Agustus sebagai 3 hari', () => {
    expect(countRentalDays(new Date('2026-08-15'), new Date('2026-08-17'))).toBe(3);
  });

  it('menghitung tanggal yang sama sebagai 1 hari', () => {
    expect(countRentalDays(new Date('2026-08-01'), new Date('2026-08-01'))).toBe(1);
  });

  it('menghitung dua tanggal berurutan sebagai 2 hari', () => {
    expect(countRentalDays(new Date('2026-08-01'), new Date('2026-08-02'))).toBe(2);
  });

  it('mengembalikan minimum 1 walau tanggal selesai lebih awal', () => {
    expect(countRentalDays(new Date('2026-08-05'), new Date('2026-08-01'))).toBe(1);
  });

  it('mengabaikan jam pada tanggal', () => {
    expect(
      countRentalDays(new Date('2026-08-01T23:00:00'), new Date('2026-08-02T01:00:00')),
    ).toBe(2);
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm test -- tests/unit/dates.test.ts`
Expected: FAIL — masih memakai aturan selisih tanggal

- [ ] **Step 3: Buat hitungan hari inklusif**

Modify `src/lib/dates.ts`:

```ts
/**
 * Jumlah hari sewa dihitung inklusif: tanggal mulai dan tanggal selesai
 * dua-duanya dihitung. 15 sampai 17 Agustus = 3 hari.
 */
export function countRentalDays(start: Date, end: Date): number {
  return Math.max(1, differenceInCalendarDays(end, start) + 1);
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npm test -- tests/unit/dates.test.ts`
Expected: PASS, 8 tes

- [ ] **Step 5: Tulis ulang tes harga**

Ganti seluruh isi `tests/unit/pricing.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import type { VehiclePricing } from '@/lib/pricing';

const innova: VehiclePricing = { rateLepasKunci: 700000, ratePelayanan: 1000000 };
const bus: VehiclePricing = { rateLepasKunci: null, ratePelayanan: 1500000 };

describe('calculateRentalPrice', () => {
  it('menghitung 15 sampai 17 Agustus sebagai 3 hari lepas kunci', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-17'),
      category: 'lepas-kunci',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(3);
    expect(hasil.breakdown.ratePerDay).toBe(700000);
    expect(hasil.breakdown.total).toBe(2100000);
  });

  it('memakai tarif pelayanan bila kategori itu dipilih', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-17'),
      category: 'pelayanan',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.total).toBe(3000000);
    expect(hasil.breakdown.category).toBe('pelayanan');
  });

  it('menghitung sewa satu hari untuk tanggal mulai dan selesai yang sama', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-15'),
      category: 'lepas-kunci',
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.breakdown.days).toBe(1);
    expect(hasil.breakdown.total).toBe(700000);
  });

  it('menolak kategori yang tidak disediakan kendaraan', () => {
    const hasil = calculateRentalPrice({
      vehicle: bus,
      startDate: new Date('2026-08-15'),
      endDate: new Date('2026-08-17'),
      category: 'lepas-kunci',
    });

    expect(hasil).toEqual({ ok: false, error: 'CATEGORY_UNAVAILABLE' });
  });

  it('menolak tanggal selesai sebelum tanggal mulai', () => {
    const hasil = calculateRentalPrice({
      vehicle: innova,
      startDate: new Date('2026-08-17'),
      endDate: new Date('2026-08-15'),
      category: 'lepas-kunci',
    });

    expect(hasil).toEqual({ ok: false, error: 'END_BEFORE_START' });
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

- [ ] **Step 6: Jalankan, pastikan gagal**

Run: `npm test -- tests/unit/pricing.test.ts`
Expected: FAIL — `calculateRentalPrice` masih bertanda tangan lama

- [ ] **Step 7: Tulis ulang fungsi harga**

Ganti seluruh isi `src/lib/pricing.ts`:

```ts
import { differenceInCalendarDays } from 'date-fns';
import { countRentalDays } from '@/lib/dates';

export type RateCategory = 'lepas-kunci' | 'pelayanan';

export type VehiclePricing = {
  rateLepasKunci: number | null;
  ratePelayanan: number | null;
};

export type RentalPriceInput = {
  vehicle: VehiclePricing;
  startDate: Date;
  endDate: Date;
  category: RateCategory;
};

export type PriceBreakdown = {
  days: number;
  category: RateCategory;
  ratePerDay: number;
  total: number;
};

export type PricingError = 'CATEGORY_UNAVAILABLE' | 'END_BEFORE_START';

export type PricingResult =
  | { ok: true; breakdown: PriceBreakdown }
  | { ok: false; error: PricingError };

export function tarifKategori(vehicle: VehiclePricing, category: RateCategory): number | null {
  return category === 'pelayanan' ? vehicle.ratePelayanan : vehicle.rateLepasKunci;
}

export function calculateRentalPrice(input: RentalPriceInput): PricingResult {
  const { vehicle, startDate, endDate, category } = input;

  // Diperiksa terpisah dari countRentalDays: fungsi itu menjaga minimum 1,
  // sehingga tanggal terbalik akan diam-diam menjadi sewa satu hari.
  if (differenceInCalendarDays(endDate, startDate) < 0) {
    return { ok: false, error: 'END_BEFORE_START' };
  }

  const ratePerDay = tarifKategori(vehicle, category);
  if (ratePerDay === null) return { ok: false, error: 'CATEGORY_UNAVAILABLE' };

  const days = countRentalDays(startDate, endDate);

  return { ok: true, breakdown: { days, category, ratePerDay, total: days * ratePerDay } };
}

/** Tarif travel bersifat tetap sekali jalan — tidak dikali hari. */
export function calculateTravelPrice(routePrice: number | null): number | null {
  return routePrice;
}
```

- [ ] **Step 8: Jalankan, pastikan lulus**

Run: `npm test -- tests/unit/pricing.test.ts`
Expected: PASS, 7 tes

- [ ] **Step 9: Tulis ulang property-based test**

Ganti seluruh isi `tests/properties/pricing.properties.test.ts`:

```ts
import { describe, it } from 'vitest';
import fc from 'fast-check';
import { addDays } from 'date-fns';
import { calculateRentalPrice, calculateTravelPrice } from '@/lib/pricing';
import type { RateCategory } from '@/lib/pricing';

const rupiah = fc.integer({ min: 50_000, max: 5_000_000 });
const awal = new Date('2026-08-01');
const kategori = fc.constantFrom<RateCategory>('lepas-kunci', 'pelayanan');

describe('properti harga sewa', () => {
  it('total tidak pernah negatif', () => {
    fc.assert(
      fc.property(rupiah, rupiah, fc.integer({ min: 0, max: 60 }), kategori, (a, b, n, k) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: a, ratePelayanan: b },
          startDate: awal,
          endDate: addDays(awal, n),
          category: k,
        });
        return !hasil.ok || hasil.breakdown.total >= 0;
      }),
    );
  });

  it('total selalu sama dengan hari dikali tarif', () => {
    fc.assert(
      fc.property(rupiah, rupiah, fc.integer({ min: 0, max: 60 }), kategori, (a, b, n, k) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: a, ratePelayanan: b },
          startDate: awal,
          endDate: addDays(awal, n),
          category: k,
        });
        if (!hasil.ok) return true;
        const d = hasil.breakdown;
        return d.total === d.days * d.ratePerDay;
      }),
    );
  });

  it('menambah durasi tidak pernah menurunkan total', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 0, max: 30 }), (tarif, n) => {
        const buat = (d: number) =>
          calculateRentalPrice({
            vehicle: { rateLepasKunci: tarif, ratePelayanan: tarif },
            startDate: awal,
            endDate: addDays(awal, d),
            category: 'lepas-kunci',
          });
        const pendek = buat(n);
        const panjang = buat(n + 1);
        if (!pendek.ok || !panjang.ok) return false;
        return panjang.breakdown.total >= pendek.breakdown.total;
      }),
    );
  });

  it('sewa tanggal yang sama selalu dihitung satu hari', () => {
    fc.assert(
      fc.property(rupiah, kategori, (tarif, k) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: tarif, ratePelayanan: tarif },
          startDate: awal,
          endDate: awal,
          category: k,
        });
        return hasil.ok && hasil.breakdown.days === 1 && hasil.breakdown.total === tarif;
      }),
    );
  });

  it('kategori tanpa tarif selalu ditolak', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 0, max: 30 }), (tarif, n) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: null, ratePelayanan: tarif },
          startDate: awal,
          endDate: addDays(awal, n),
          category: 'lepas-kunci',
        });
        return !hasil.ok && hasil.error === 'CATEGORY_UNAVAILABLE';
      }),
    );
  });

  it('tanggal selesai sebelum tanggal mulai selalu ditolak', () => {
    fc.assert(
      fc.property(rupiah, fc.integer({ min: 1, max: 30 }), (tarif, n) => {
        const hasil = calculateRentalPrice({
          vehicle: { rateLepasKunci: tarif, ratePelayanan: tarif },
          startDate: addDays(awal, n),
          endDate: awal,
          category: 'lepas-kunci',
        });
        return !hasil.ok && hasil.error === 'END_BEFORE_START';
      }),
    );
  });

  it('harga travel tidak terpengaruh tanggal maupun durasi', () => {
    fc.assert(
      fc.property(fc.option(rupiah, { nil: null }), (harga) => calculateTravelPrice(harga) === harga),
    );
  });
});
```

- [ ] **Step 10: Jalankan property test**

Run: `npm test -- tests/properties/pricing.properties.test.ts`
Expected: PASS, 7 properti

- [ ] **Step 11: Commit**

```bash
git add src/lib/pricing.ts src/lib/dates.ts tests/unit/pricing.test.ts tests/unit/dates.test.ts tests/properties/pricing.properties.test.ts
git commit -m "feat: harga dua kategori per hari dengan hitungan hari inklusif"
```

---

### Task 2: Skema database dan migrasi

**Files:**
- Modify: `src/db/schema.ts`
- Create: `scripts/migrasi-tarif.mjs`
- Test: `tests/unit/schema.test.ts`

**Interfaces:**
- Consumes: tipe dari `@/lib/pricing`
- Produces: kolom `vehicles.rateLepasKunci`, `vehicles.ratePelayanan`, `bookings.rateCategory`; tipe `PriceBreakdownJson` menjadi gabungan bentuk lama dan baru

- [ ] **Step 1: Tambahkan kolom baru pada skema**

Modify `src/db/schema.ts` — pada tabel `vehicles`, tambahkan setelah `rate12h`:

```ts
  rateLepasKunci: integer('rate_lepas_kunci'),
  ratePelayanan: integer('rate_pelayanan'),
```

Pada tabel `bookings`, tambahkan setelah `rateType`:

```ts
  rateCategory: rateCategoryEnum('rate_category'),
```

Dan enum barunya di dekat enum lain:

```ts
export const rateCategoryEnum = pgEnum('rate_category', ['lepas-kunci', 'pelayanan']);
```

Kolom `rate24h`, `rate12h`, `driverFeeOverride`, `rateType`, dan `driverDays` **tidak dihapus**. Pesanan Fase 1 mengisinya, dan menghapusnya berarti menghancurkan riwayat. Kolom `rate24h` diubah menjadi boleh kosong agar kendaraan baru tidak wajib mengisinya:

```ts
  rate24h: integer('rate_24h'),
```

- [ ] **Step 2: Perluas tipe rincian harga menjadi gabungan**

Modify `src/db/schema.ts` — ganti `PriceBreakdownJson`:

```ts
/** Bentuk rincian harga Fase 1. Masih tersimpan pada pesanan lama. */
export type PriceBreakdownLama = {
  days: number;
  ratePerDay: number;
  rentalCost: number;
  driverDays: number;
  driverFeePerDay: number;
  driverCost: number;
  total: number;
};

/** Bentuk rincian harga Fase 2. */
export type PriceBreakdownBaru = {
  days: number;
  category: 'lepas-kunci' | 'pelayanan';
  ratePerDay: number;
  total: number;
};

export type PriceBreakdownJson = PriceBreakdownLama | PriceBreakdownBaru;

/** Membedakan keduanya tanpa menebak: hanya bentuk lama punya driverDays. */
export function adalahRincianLama(r: PriceBreakdownJson): r is PriceBreakdownLama {
  return 'driverDays' in r;
}
```

- [ ] **Step 3: Tambahkan tes bentuk skema**

Tambahkan ke `tests/unit/schema.test.ts`:

```ts
import { adalahRincianLama } from '@/db/schema';

describe('kolom tarif dua kategori', () => {
  it('menyediakan kolom tarif lepas kunci dan pelayanan', () => {
    const c = kolom(vehicles);
    expect(c['rate_lepas_kunci']).toBeDefined();
    expect(c['rate_pelayanan']).toBeDefined();
  });

  it('membiarkan kolom tarif lama tetap ada demi pesanan Fase 1', () => {
    const c = kolom(vehicles);
    expect(c['rate_24h']).toBeDefined();
    expect(c['rate_24h'].notNull).toBe(false);
  });

  it('menyediakan kolom kategori pada pesanan', () => {
    expect(kolom(bookings)['rate_category']).toBeDefined();
  });
});

describe('adalahRincianLama', () => {
  it('mengenali rincian Fase 1 dari adanya driverDays', () => {
    expect(
      adalahRincianLama({
        days: 5,
        ratePerDay: 900000,
        rentalCost: 4500000,
        driverDays: 3,
        driverFeePerDay: 150000,
        driverCost: 450000,
        total: 4950000,
      }),
    ).toBe(true);
  });

  it('mengenali rincian Fase 2', () => {
    expect(
      adalahRincianLama({ days: 3, category: 'pelayanan', ratePerDay: 1000000, total: 3000000 }),
    ).toBe(false);
  });
});
```

- [ ] **Step 4: Jalankan tes skema**

Run: `npm test -- tests/unit/schema.test.ts`
Expected: PASS

- [ ] **Step 5: Buat dan jalankan migrasi**

```bash
npm run db:generate
npm run db:migrate
```

Expected: berkas SQL baru di `drizzle/`, migrasi diterapkan tanpa error.

- [ ] **Step 6: Isi tarif kendaraan yang sudah ada**

Create `scripts/migrasi-tarif.mjs`:

```js
import { neon } from '@neondatabase/serverless';

/**
 * Menyalin tarif 24 jam lama menjadi tarif lepas kunci, sebagai titik awal.
 * Tarif pelayanan sengaja dibiarkan kosong: nilainya keputusan bisnis, bukan
 * turunan rumus, dan menebaknya berarti menayangkan harga yang salah.
 *
 * Jalankan sekali: node --env-file=.env.local scripts/migrasi-tarif.mjs
 */
const sql = neon(process.env.DATABASE_URL);

const hasil = await sql`
  update vehicles
  set rate_lepas_kunci = rate_24h
  where rate_lepas_kunci is null and rate_24h is not null
  returning name, rate_lepas_kunci`;

for (const v of hasil) console.log(`${v.name}: lepas kunci = ${v.rate_lepas_kunci}`);
console.log(`\n${hasil.length} kendaraan terisi. Tarif pelayanan harus diisi lewat panel admin.`);
```

Run: `node --env-file=.env.local scripts/migrasi-tarif.mjs`
Expected: 8 kendaraan terisi tarif lepas kunci.

- [ ] **Step 7: Commit**

```bash
git add src/db/schema.ts drizzle/ scripts/migrasi-tarif.mjs tests/unit/schema.test.ts
git commit -m "feat: kolom tarif dua kategori, kolom lama dipertahankan untuk pesanan Fase 1"
```

---

### Task 3: Skema validasi

**Files:**
- Modify: `src/schemas/booking.ts`, `src/schemas/vehicle.ts`, `src/schemas/settings.ts`
- Test: `tests/unit/schemas.test.ts`, `tests/unit/schemas-localized.test.ts`

**Interfaces:**
- Consumes: `RateCategory` dari `@/lib/pricing`
- Produces: `bookingInputSchema` dengan `rateCategory`; `vehicleInputSchema` dengan dua tarif; `settingsInputSchema` tanpa `driverFeePerDay`

- [ ] **Step 1: Ubah tes skema booking**

Di `tests/unit/schemas.test.ts`, ganti objek `sewaValid` dan tes terkait hari sopir:

```ts
const sewaValid = {
  customerName: 'Budi Santoso',
  phone: '081234567890',
  email: 'budi@example.com',
  serviceType: 'with-driver' as const,
  vehicleId: '11111111-1111-4111-8111-111111111111',
  startDate: '2099-08-15',
  endDate: '2099-08-17',
  rateCategory: 'pelayanan' as const,
  notes: '',
};
```

Hapus tes `menolak hari sopir melebihi durasi`, dan tambahkan:

```ts
  it('menolak pesanan sewa tanpa kategori tarif', () => {
    const { rateCategory: _abaikan, ...tanpaKategori } = sewaValid;
    expect(bookingInputSchema.safeParse(tanpaKategori).success).toBe(false);
  });

  it('menolak kategori tarif yang tidak dikenal', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, rateCategory: 'gratis' });
    expect(r.success).toBe(false);
  });

  it('menerima tanggal mulai sama dengan tanggal selesai', () => {
    const r = bookingInputSchema.safeParse({
      ...sewaValid,
      startDate: '2099-08-15',
      endDate: '2099-08-15',
    });
    expect(r.success).toBe(true);
  });
```

Pada bagian travel, ganti `rateType` menjadi `rateCategory`:

```ts
  it('menolak pesanan travel yang membawa kategori tarif', () => {
    const r = bookingInputSchema.safeParse({ ...travelValid, rateCategory: 'pelayanan' });
    expect(r.success).toBe(false);
  });
```

Hapus tes `menolak pesanan travel dengan hari sopir lebih dari nol`.

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: FAIL

- [ ] **Step 3: Ubah skema booking**

Modify `src/schemas/booking.ts` — ganti kedua cabang dan `superRefine`:

```ts
const sewaKendaraan = z.object({
  ...dasar,
  serviceType: z.enum(['self-drive', 'with-driver', 'tourism']),
  vehicleId: z.string().uuid('Kendaraan wajib dipilih'),
  routeId: z.undefined().optional(),
  endDate: tanggal,
  rateCategory: z.enum(['lepas-kunci', 'pelayanan']),
});

const travel = z.object({
  ...dasar,
  serviceType: z.literal('travel'),
  routeId: z.string().uuid('Rute wajib dipilih'),
  vehicleId: z.undefined().optional(),
  endDate: z.undefined().optional(),
  rateCategory: z.undefined().optional(),
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

    // Tanggal selesai boleh sama dengan tanggal mulai — itu sewa satu hari.
    if (startOfDay(new Date(data.endDate)) < mulai) {
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'Tanggal selesai tidak boleh sebelum tanggal mulai',
      });
    }
  });
```

Hapus `driverDays` dari kedua cabang dan dari `dasar`.

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npm test -- tests/unit/schemas.test.ts`
Expected: PASS

- [ ] **Step 5: Ubah skema kendaraan**

Modify `src/schemas/vehicle.ts` — ganti kedua field tarif dan `.refine`:

```ts
    rateLepasKunci: z.coerce.number().int().min(0).nullable().default(null),
    ratePelayanan: z.coerce.number().int().min(0).nullable().default(null),
```

Hapus `rate24h` dan `rate12h`, lalu ganti `.refine` terakhir:

```ts
  .refine((v) => v.rateLepasKunci !== null || v.ratePelayanan !== null, {
    path: ['rateLepasKunci'],
    message: 'Isi minimal satu tarif: lepas kunci atau pelayanan',
  });
```

- [ ] **Step 6: Sesuaikan tes kendaraan**

Di `tests/unit/schemas-localized.test.ts`, ganti `mobilValid`:

```ts
const mobilValid = {
  name: 'Innova Zenix G',
  category: 'mpv' as const,
  rateLepasKunci: 900000,
  ratePelayanan: 1300000,
  serviceTypes: ['self-drive' as const],
  seats: 7,
  transmission: 'automatic' as const,
  fuelType: 'petrol' as const,
  year: 2024,
  features: { id: ['AC Dingin'], en: ['Cold AC'] },
  rentalTerms: { id: ['Lepas kunci'] },
};
```

Ganti tes `menolak tarif 12 jam yang lebih mahal` dan `menerima tarif 12 jam kosong` dengan:

```ts
  it('menerima kendaraan yang hanya punya tarif pelayanan', () => {
    const r = vehicleInputSchema.safeParse({ ...mobilValid, rateLepasKunci: null });
    expect(r.success).toBe(true);
  });

  it('menolak kendaraan tanpa tarif sama sekali', () => {
    const r = vehicleInputSchema.safeParse({
      ...mobilValid,
      rateLepasKunci: null,
      ratePelayanan: null,
    });
    expect(r.success).toBe(false);
  });
```

- [ ] **Step 7: Hapus tarif sopir dari pengaturan**

Modify `src/schemas/settings.ts` — hapus baris `driverFeePerDay`.

Modify `src/queries/settings.ts` — hapus `driverFeePerDay` dari `DEFAULT_SETTINGS`.

Di `tests/unit/schemas-localized.test.ts`, hapus `driverFeePerDay` dari `settingsDasar` dan hapus tes `menerima tarif sopir nol`.

- [ ] **Step 8: Jalankan seluruh tes unit**

Run: `npm test -- tests/unit`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/schemas src/queries/settings.ts tests/unit
git commit -m "feat: skema validasi untuk kategori tarif, tarif sopir dihapus"
```

---

### Task 4: Alur booking

**Files:**
- Modify: `src/actions/booking.ts`, `src/lib/whatsapp.ts`, `src/components/booking/PriceSummary.tsx`, `src/components/booking/BookingForm.tsx`
- Modify: `src/i18n/messages/id.ts`, `en.ts`, `zh.ts`, `ko.ts`
- Test: `tests/unit/whatsapp.test.ts`, `tests/components/booking-form.test.tsx`, `tests/integration/booking-action.test.ts`

**Interfaces:**
- Consumes: `calculateRentalPrice`, `RateCategory` dari `@/lib/pricing`; `bookingInputSchema` dari `@/schemas/booking`
- Produces: `createBooking` menyimpan `rateCategory` dan rincian bentuk baru

- [ ] **Step 1: Ganti kunci kamus**

Di keempat berkas `src/i18n/messages/*.ts`, pada blok `booking` ganti `ratePackage` dan tambahkan kategori. Untuk `id.ts`:

```ts
    rateCategory: 'Kategori sewa',
    lepasKunci: 'Lepas kunci',
    lepasKunciNote: 'Kendaraan saja, Anda menyetir sendiri',
    pelayanan: 'Pelayanan',
    pelayananNote: 'Kendaraan + pengemudi + BBM',
    perHari: 'per hari',
    rentalLine: 'Sewa {days} hari × {harga}',
```

Untuk `en.ts`: `'Rental category'`, `'Self-drive'`, `'Vehicle only, you drive'`, `'Full service'`, `'Vehicle + driver + fuel'`, `'per day'`, `'Rental {days} days × {harga}'`.

Untuk `zh.ts`: `'租车类别'`, `'自驾'`, `'仅车辆，您自行驾驶'`, `'含司机服务'`, `'车辆 + 司机 + 油费'`, `'每天'`, `'租车 {days} 天 × {harga}'`.

Untuk `ko.ts`: `'렌트 유형'`, `'자차 운전'`, `'차량만, 직접 운전'`, `'풀 서비스'`, `'차량 + 기사 + 연료'`, `'1일당'`, `'대여 {days}일 × {harga}'`.

Hapus dari keempatnya: `ratePackage`, `driverDays`, `driverDaysHint`, `driverDaysMax`, `driverDaysTooMany`, `driverLine`, `perDay24`, `perDay12`, `rate24`, `rate12`, `driverFeeNote`, dan seluruh blok `pricingError` lama. Ganti `pricingError` dengan:

```ts
  pricingError: {
    CATEGORY_UNAVAILABLE: 'Kendaraan ini tidak tersedia untuk kategori tersebut.',
    END_BEFORE_START: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
  },
```

(terjemahan masing-masing bahasa mengikuti gaya yang sudah ada di berkasnya)

- [ ] **Step 2: Ubah tes pesan WhatsApp**

Di `tests/unit/whatsapp.test.ts`, ganti objek `sewa` dan tes hari sopir:

```ts
  const sewa = {
    bookingCode: 'LNS-20260815-A7K2',
    customerName: 'Budi Santoso',
    itemName: 'Innova Zenix G',
    startDate: '2026-08-15',
    endDate: '2026-08-17',
    days: 3,
    categoryLabel: 'Pelayanan (mobil + sopir + BBM)',
    totalPrice: 3000000,
    notes: 'Jemput di bandara',
  };

  it('menyebut kategori sewa dan jumlah hari', () => {
    const pesan = buildBookingMessage(sewa);
    expect(pesan).toContain('Pelayanan');
    expect(pesan).toContain('3 hari');
  });
```

Hapus tes `tidak menyebut sopir bila hari sopir nol` dan `menjelaskan jumlah hari sewa dan hari pakai sopir`.

- [ ] **Step 3: Ubah penyusun pesan**

Modify `src/lib/whatsapp.ts` — ganti tipe dan bagian yang menyebut sopir:

```ts
export type BookingMessageArgs = {
  bookingCode: string;
  customerName: string;
  itemName: string;
  startDate: string;
  endDate?: string | null;
  days?: number | null;
  categoryLabel?: string | null;
  totalPrice: number | null;
  notes?: string | null;
};
```

Ganti dua baris di dalam fungsi:

```ts
  if (a.days) baris.push(`Durasi: ${a.days} hari`);
  if (a.categoryLabel) baris.push(`Kategori: ${a.categoryLabel}`);
```

Hapus baris `Pakai sopir` dan `rateType`.

- [ ] **Step 4: Jalankan tes WhatsApp**

Run: `npm test -- tests/unit/whatsapp.test.ts`
Expected: PASS

- [ ] **Step 5: Ubah Server Action**

Modify `src/actions/booking.ts` — ganti blok perhitungan sewa kendaraan:

```ts
    const hasil = calculateRentalPrice({
      vehicle: {
        rateLepasKunci: vehicle.rateLepasKunci,
        ratePelayanan: vehicle.ratePelayanan,
      },
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      category: data.rateCategory,
    });

    if (!hasil.ok) return fail(PESAN_KESALAHAN[hasil.error] ?? 'Perhitungan harga gagal.');

    itemName = vehicle.name;
    totalPrice = hasil.breakdown.total;
    priceBreakdown = hasil.breakdown;
    days = hasil.breakdown.days;
    categoryLabel =
      data.rateCategory === 'pelayanan' ? 'Pelayanan (mobil + sopir + BBM)' : 'Lepas kunci';
```

Ganti `PESAN_KESALAHAN`:

```ts
const PESAN_KESALAHAN: Record<string, string> = {
  CATEGORY_UNAVAILABLE: 'Kendaraan ini tidak tersedia untuk kategori yang dipilih.',
  END_BEFORE_START: 'Tanggal selesai tidak boleh sebelum tanggal mulai.',
};
```

Pada `db.insert(bookings).values({...})`, ganti `rateType` dan `driverDays`:

```ts
    rateCategory: data.serviceType === 'travel' ? null : data.rateCategory,
```

Hapus `driverDays` dari objek nilai (kolomnya berdefault 0).

Hapus pembacaan `settings.driverFeePerDay`.

- [ ] **Step 6: Ubah ringkasan harga**

Modify `src/components/booking/PriceSummary.tsx` — ganti penyusunan baris:

```ts
  const baris = [
    {
      label: fill(t.booking.rentalLine, {
        days: breakdown.days,
        harga: formatRupiah(breakdown.ratePerDay),
      }),
      nilai: breakdown.total,
    },
  ];
```

Hapus blok baris sopir.

- [ ] **Step 7: Ubah form booking**

Modify `src/components/booking/BookingForm.tsx`:

- Ganti `rateType: RateType` menjadi `rateCategory: RateCategory` pada `FormValues` dan `defaultValues` (bawaan `'lepas-kunci'`).
- Ganti tipe `BookingVehicleOption` menjadi `{ id, slug, name, rateLepasKunci, ratePelayanan, status }`.
- Hapus seluruh state dan JSX `driverDays`, `sopirBerlebih`, dan `jumlahHari`.
- Ganti blok `fieldset` paket tarif dengan pilihan kategori:

```tsx
        {!adalahTravel && kendaraanTerpilih ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t.booking.rateCategory}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {kendaraanTerpilih.rateLepasKunci !== null ? (
                <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-300 p-4 has-checked:border-lians-500 has-checked:bg-lians-50">
                  <input type="radio" value="lepas-kunci" {...register('rateCategory')} />
                  <span>
                    <span className="block font-semibold">{t.booking.lepasKunci}</span>
                    <span className="block text-xs text-muted">{t.booking.lepasKunciNote}</span>
                    <span className="mt-1 block font-bold text-lians-600">
                      {formatRupiah(kendaraanTerpilih.rateLepasKunci)} {t.booking.perHari}
                    </span>
                  </span>
                </label>
              ) : null}

              {kendaraanTerpilih.ratePelayanan !== null ? (
                <label className="flex cursor-pointer gap-3 rounded-xl border border-slate-300 p-4 has-checked:border-lians-500 has-checked:bg-lians-50">
                  <input type="radio" value="pelayanan" {...register('rateCategory')} />
                  <span>
                    <span className="block font-semibold">{t.booking.pelayanan}</span>
                    <span className="block text-xs text-muted">{t.booking.pelayananNote}</span>
                    <span className="mt-1 block font-bold text-lians-600">
                      {formatRupiah(kendaraanTerpilih.ratePelayanan)} {t.booking.perHari}
                    </span>
                  </span>
                </label>
              ) : null}
            </div>
          </fieldset>
        ) : null}
```

- Pada `useMemo` perhitungan, ganti pemanggilan menjadi bentuk baru dan hapus `driverFeePerDay` dari props serta dependensi.
- Pada payload submit, ganti `rateType`/`driverDays` menjadi `rateCategory: v.rateCategory`.

- [ ] **Step 8: Tulis ulang tes form booking**

Ganti isi `tests/components/booking-form.test.tsx` dengan versi tanpa hari sopir:

```tsx
const kendaraan = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'innova-zenix-g',
    name: 'Innova Zenix G',
    rateLepasKunci: 900000,
    ratePelayanan: 1300000,
    status: 'available' as const,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'hiace-commuter',
    name: 'Hiace Commuter',
    rateLepasKunci: null,
    ratePelayanan: 1500000,
    status: 'available' as const,
  },
];
```

Tes yang harus ada:

```tsx
  it('menghitung 15 sampai 17 sebagai 3 hari lepas kunci', async () => {
    const user = userEvent.setup();
    render1();
    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-15');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-17');
    expect(await screen.findAllByText(/Rp 2\.700\.000/)).not.toHaveLength(0);
  });

  it('memakai tarif pelayanan saat kategori itu dipilih', async () => {
    const user = userEvent.setup();
    render1();
    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-15');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-17');
    await user.click(screen.getByRole('radio', { name: /pelayanan/i }));
    expect(await screen.findAllByText(/Rp 3\.900\.000/)).not.toHaveLength(0);
  });

  it('menyembunyikan pilihan lepas kunci untuk kendaraan yang tidak menyediakannya', async () => {
    const user = userEvent.setup();
    render1();
    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[1].id);
    expect(screen.queryByRole('radio', { name: /lepas kunci/i })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /pelayanan/i })).toBeInTheDocument();
  });

  it('menghitung sewa satu hari untuk tanggal yang sama', async () => {
    const user = userEvent.setup();
    render1();
    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-15');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-15');
    expect(await screen.findAllByText(/Rp 900\.000/)).not.toHaveLength(0);
  });

  it('mengirim rateCategory pada payload', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, message: 'berhenti' });
    render1(onSubmit);
    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-15');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-17');
    await user.type(screen.getByLabelText(/nama lengkap/i), 'Budi');
    await user.type(screen.getByLabelText(/nomor whatsapp/i), '081234567890');
    await user.click(screen.getByRole('button', { name: /kirim pesanan/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ rateCategory: 'lepas-kunci' }),
    );
    const payload = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('driverDays');
  });
```

Pertahankan tes travel yang sudah ada, ganti `rateType` menjadi `rateCategory` pada asersinya.

- [ ] **Step 9: Ubah tes integrasi booking**

Di `tests/integration/booking-action.test.ts`, ganti seluruh pemanggilan `createBooking` untuk sewa kendaraan: hapus `rateType` dan `driverDays`, tambahkan `rateCategory`. Ganti asersi harga:

```ts
    // 15 sampai 17 = 3 hari inklusif.
    expect(row.priceBreakdown?.days).toBe(3);
    expect(row.totalPrice).toBe(3 * mobil.rateLepasKunci);
```

Ganti tes `menolak hari sopir yang melebihi durasi sewa` dengan:

```ts
  it('menolak kategori yang tidak disediakan kendaraan', async () => {
    const mobil = (await getPublishedVehicles()).find((v) => v.rateLepasKunci === null);
    if (!mobil) return;

    const hasil = await createBooking({
      serviceType: 'self-drive',
      vehicleId: mobil.id,
      startDate: iso(besok()),
      endDate: iso(plusHari(besok(), 1)),
      rateCategory: 'lepas-kunci',
      customerName: 'Uji Kategori',
      phone: '081234567890',
    });

    expect(hasil.ok).toBe(false);
  });
```

- [ ] **Step 10: Jalankan tes terkait**

Run: `npm test -- tests/components/booking-form.test.tsx tests/integration/booking-action.test.ts`
Expected: PASS

- [ ] **Step 11: Commit**

```bash
git add src/actions/booking.ts src/lib/whatsapp.ts src/components/booking src/i18n tests
git commit -m "feat: alur booking memakai kategori tarif, hari sopir dihapus"
```

---

### Task 5: Tampilan publik

**Files:**
- Create: `src/lib/vehicle-rate.ts`
- Modify: `src/components/vehicle/VehicleCard.tsx`, `src/lib/vehicle-filter.ts`, `src/app/[locale]/mobil/[slug]/page.tsx`, `src/app/[locale]/booking/page.tsx`
- Test: `tests/unit/vehicle-rate.test.ts`, `tests/components/vehicle.test.tsx`, `tests/unit/vehicle-filter.test.ts`

**Interfaces:**
- Consumes: `VehiclePricing` dari `@/lib/pricing`
- Produces, dari `@/lib/vehicle-rate`: `tarifTerendah(v: VehiclePricing): number | null`

- [ ] **Step 1: Tulis tes tarif terendah**

Create `tests/unit/vehicle-rate.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { tarifTerendah } from '@/lib/vehicle-rate';

describe('tarifTerendah', () => {
  it('mengambil yang paling murah dari dua tarif', () => {
    expect(tarifTerendah({ rateLepasKunci: 900000, ratePelayanan: 1300000 })).toBe(900000);
  });

  it('memakai tarif pelayanan bila lepas kunci tidak tersedia', () => {
    expect(tarifTerendah({ rateLepasKunci: null, ratePelayanan: 1500000 })).toBe(1500000);
  });

  it('memakai tarif lepas kunci bila pelayanan tidak tersedia', () => {
    expect(tarifTerendah({ rateLepasKunci: 350000, ratePelayanan: null })).toBe(350000);
  });

  it('mengembalikan null bila keduanya kosong', () => {
    expect(tarifTerendah({ rateLepasKunci: null, ratePelayanan: null })).toBeNull();
  });
});
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm test -- tests/unit/vehicle-rate.test.ts`
Expected: FAIL — modul belum ada

- [ ] **Step 3: Buat helper tarif**

Create `src/lib/vehicle-rate.ts`:

```ts
import type { VehiclePricing } from '@/lib/pricing';

/**
 * Tarif termurah yang tersedia, dipakai untuk label "mulai dari" di katalog,
 * untuk pengurutan, dan untuk filter harga maksimum. Kendaraan bisa saja hanya
 * menyediakan salah satu kategori.
 */
export function tarifTerendah(v: VehiclePricing): number | null {
  const tersedia = [v.rateLepasKunci, v.ratePelayanan].filter(
    (n): n is number => n !== null,
  );
  return tersedia.length === 0 ? null : Math.min(...tersedia);
}
```

- [ ] **Step 4: Jalankan, pastikan lulus**

Run: `npm test -- tests/unit/vehicle-rate.test.ts`
Expected: PASS, 4 tes

- [ ] **Step 5: Ubah kartu kendaraan**

Modify `src/components/vehicle/VehicleCard.tsx` — ganti blok harga di bagian bawah kartu:

```tsx
        <div className="border-t border-slate-100 pt-3">
          {vehicle.rateLepasKunci !== null ? (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted">{t.booking.lepasKunci}</span>
              <span className="font-bold text-lians-600">
                {formatRupiah(vehicle.rateLepasKunci)}
                <span className="ml-1 text-xs font-medium text-muted">{t.booking.perHari}</span>
              </span>
            </div>
          ) : null}

          {vehicle.ratePelayanan !== null ? (
            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted">{t.booking.pelayanan}</span>
              <span className="font-bold text-slate-700">
                {formatRupiah(vehicle.ratePelayanan)}
                <span className="ml-1 text-xs font-medium text-muted">{t.booking.perHari}</span>
              </span>
            </div>
          ) : null}
        </div>
```

- [ ] **Step 6: Ubah filter katalog**

Modify `src/lib/vehicle-filter.ts` — ganti perbandingan harga:

```ts
import { tarifTerendah } from '@/lib/vehicle-rate';
```

Dalam `filterAndSortVehicles`, ganti baris `maxPrice` dan blok `switch`:

```ts
    if (filters.maxPrice !== undefined) {
      const tarif = tarifTerendah(v);
      if (tarif === null || tarif > filters.maxPrice) return false;
    }
```

```ts
  const urut = (a: Vehicle, b: Vehicle) =>
    (tarifTerendah(a) ?? Infinity) - (tarifTerendah(b) ?? Infinity);

  switch (filters.sort) {
    case 'harga-asc':
      return [...hasil].sort(urut);
    case 'harga-desc':
      return [...hasil].sort((a, b) => urut(b, a));
    case 'nama-asc':
      return [...hasil].sort((a, b) => a.name.localeCompare(b.name, 'id'));
    default:
      return hasil;
  }
```

- [ ] **Step 7: Sesuaikan tes kendaraan dan filter**

Di `tests/components/vehicle.test.tsx` dan `tests/unit/vehicle-filter.test.ts`, ganti setiap `rate24h`/`rate12h` pada data uji menjadi `rateLepasKunci`/`ratePelayanan`. Tambahkan ke tes komponen:

```tsx
  it('menampilkan kedua kategori tarif bila tersedia', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByText(/Lepas kunci/i)).toBeInTheDocument();
    expect(screen.getByText(/Pelayanan/i)).toBeInTheDocument();
  });

  it('menyembunyikan kategori yang tidak bertarif', () => {
    render(<VehicleCard vehicle={{ ...dasar, rateLepasKunci: null }} locale="id" />);
    expect(screen.queryByText(/Lepas kunci/i)).not.toBeInTheDocument();
  });
```

- [ ] **Step 8: Ubah halaman detail dan halaman booking**

Modify `src/app/[locale]/mobil/[slug]/page.tsx`:
- Ganti dua kotak tarif menjadi dua kotak kategori memakai `t.booking.lepasKunci` dan `t.booking.pelayanan`, masing-masing tampil hanya bila tarifnya ada.
- Hapus paragraf `t.vehicle.driverFeeNote`.
- Pada `generateMetadata`, ganti `formatRupiah(v.rate24h)` menjadi `formatRupiah(tarifTerendah(v) ?? 0)`.

Modify `src/app/[locale]/booking/page.tsx` — ganti pemetaan kendaraan:

```tsx
        vehicles={vehicles.map((v) => ({
          id: v.id,
          slug: v.slug,
          name: v.name,
          rateLepasKunci: v.rateLepasKunci,
          ratePelayanan: v.ratePelayanan,
          status: v.status,
        }))}
```

Hapus prop `driverFeePerDay`.

- [ ] **Step 9: Jalankan tes dan build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: semua lulus

- [ ] **Step 10: Commit**

```bash
git add src/lib/vehicle-rate.ts src/lib/vehicle-filter.ts src/components/vehicle src/app tests
git commit -m "feat: tampilan publik menampilkan dua kategori tarif"
```

---

### Task 6: Panel admin

Bagian paling berisiko: halaman detail pesanan harus membaca rincian lama **dan** baru.

**Files:**
- Modify: `src/components/admin/VehicleForm.tsx`, `src/components/admin/SettingsForm.tsx`, `src/app/admin/armada/page.tsx`, `src/app/admin/booking/[id]/page.tsx`, `src/db/seed.ts`
- Test: `tests/integration/admin-vehicles.test.ts`, `tests/integration/regresi-pesanan-lama.test.ts`

**Interfaces:**
- Consumes: `adalahRincianLama` dari `@/db/schema`
- Produces: form kendaraan dengan dua tarif; detail pesanan yang menangani dua bentuk rincian

- [ ] **Step 1: Tulis tes regresi pesanan lama**

Create `tests/integration/regresi-pesanan-lama.test.ts`:

```ts
import { describe, it, expect, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { bookings, adalahRincianLama } from '@/db/schema';

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

jalankan('pesanan Fase 1 setelah model harga berubah', () => {
  it('tetap terbaca dan dikenali sebagai rincian lama', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-REGRESI-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        customerName: 'Pesanan Fase Satu',
        phone: '081234567890',
        serviceType: 'with-driver',
        startDate: '2026-08-01',
        endDate: '2026-08-06',
        rateType: '24h',
        driverDays: 3,
        totalPrice: 4950000,
        priceBreakdown: {
          days: 5,
          ratePerDay: 900000,
          rentalCost: 4500000,
          driverDays: 3,
          driverFeePerDay: 150000,
          driverCost: 450000,
          total: 4950000,
        },
        status: 'confirmed',
      })
      .returning({ id: bookings.id });
    dibuat.push(row.id);

    const [tersimpan] = await db.select().from(bookings).where(eq(bookings.id, row.id));

    expect(tersimpan.priceBreakdown).toBeTruthy();
    expect(adalahRincianLama(tersimpan.priceBreakdown!)).toBe(true);
    expect(tersimpan.totalPrice).toBe(4950000);
    expect(tersimpan.rateCategory).toBeNull();
  });

  it('pesanan baru memakai bentuk rincian Fase 2', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-BARU-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        customerName: 'Pesanan Fase Dua',
        phone: '081234567890',
        serviceType: 'with-driver',
        startDate: '2026-08-15',
        endDate: '2026-08-17',
        rateCategory: 'pelayanan',
        totalPrice: 3000000,
        priceBreakdown: {
          days: 3,
          category: 'pelayanan',
          ratePerDay: 1000000,
          total: 3000000,
        },
        status: 'pending',
      })
      .returning({ id: bookings.id });
    dibuat.push(row.id);

    const [tersimpan] = await db.select().from(bookings).where(eq(bookings.id, row.id));
    expect(adalahRincianLama(tersimpan.priceBreakdown!)).toBe(false);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(bookings).where(eq(bookings.id, id));
});
```

- [ ] **Step 2: Jalankan tes regresi**

Run: `npm test -- tests/integration/regresi-pesanan-lama.test.ts`
Expected: PASS, 2 tes

- [ ] **Step 3: Ubah detail pesanan agar menangani dua bentuk**

Modify `src/app/admin/booking/[id]/page.tsx` — ganti blok "Harga saat dipesan":

```tsx
            {rincian ? (
              adalahRincianLama(rincian) ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>
                      Sewa {rincian.days} hari × {formatRupiah(rincian.ratePerDay)}
                    </dt>
                    <dd>{formatRupiah(rincian.rentalCost)}</dd>
                  </div>
                  {rincian.driverDays > 0 ? (
                    <div className="flex justify-between">
                      <dt>
                        Sopir {rincian.driverDays} hari × {formatRupiah(rincian.driverFeePerDay)}
                      </dt>
                      <dd>{formatRupiah(rincian.driverCost)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <dt>Total</dt>
                    <dd className="text-lians-700">{formatRupiah(rincian.total)}</dd>
                  </div>
                  <p className="pt-2 text-xs text-muted">
                    Pesanan ini dibuat dengan model harga lama (24 jam + biaya sopir terpisah).
                  </p>
                </dl>
              ) : (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>
                      {rincian.category === 'pelayanan' ? 'Pelayanan' : 'Lepas kunci'} —{' '}
                      {rincian.days} hari × {formatRupiah(rincian.ratePerDay)}
                    </dt>
                    <dd>{formatRupiah(rincian.total)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <dt>Total</dt>
                    <dd className="text-lians-700">{formatRupiah(rincian.total)}</dd>
                  </div>
                </dl>
              )
            ) : (
              <p className="text-sm text-muted">
                Rute ini belum bertarif tetap saat dipesan. Kirimkan penawaran lewat WhatsApp, lalu
                catat kesepakatannya di catatan internal.
              </p>
            )}
```

Tambahkan impor `adalahRincianLama` dari `@/db/schema`.

Pada daftar `baris`, ganti entri paket tarif:

```ts
    ['Kategori', booking.rateCategory === 'pelayanan' ? 'Pelayanan' : booking.rateCategory === 'lepas-kunci' ? 'Lepas kunci' : booking.rateType === '12h' ? '12 jam (model lama)' : booking.rateType === '24h' ? '24 jam (model lama)' : '—'],
```

Hapus baris `Hari pakai sopir` bila `rateCategory` terisi; pertahankan bila pesanan memakai model lama.

- [ ] **Step 4: Ubah form kendaraan**

Modify `src/components/admin/VehicleForm.tsx`:
- Pada `Values`, ganti `rate24h: number; rate12h: number | ''` menjadi `rateLepasKunci: number | ''; ratePelayanan: number | ''`.
- Ganti kedua isian tarif:

```tsx
        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif lepas kunci / hari (Rp)</span>
          <input type="number" min={0} step={50000} {...register('rateLepasKunci')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Kendaraan saja. Kosongkan bila tidak dilepas-kunci.
          </span>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif pelayanan / hari (Rp)</span>
          <input type="number" min={0} step={50000} {...register('ratePelayanan')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Sudah termasuk pengemudi dan BBM. Kosongkan bila tidak ditawarkan.
          </span>
        </label>
```

- Pada `kirim`, ganti konversi nilai:

```ts
      rateLepasKunci: v.rateLepasKunci === '' ? null : Number(v.rateLepasKunci),
      ratePelayanan: v.ratePelayanan === '' ? null : Number(v.ratePelayanan),
```

- Tambahkan penjagaan sebelum kirim:

```ts
    if (v.rateLepasKunci === '' && v.ratePelayanan === '') {
      toast.error('Isi minimal satu tarif: lepas kunci atau pelayanan.');
      return;
    }
```

- [ ] **Step 5: Ubah daftar armada dan pengaturan**

Modify `src/app/admin/armada/page.tsx` — ganti dua kolom tabel:

```tsx
              <th className="p-4">Lepas kunci</th>
              <th className="p-4">Pelayanan</th>
```

```tsx
                <td className="p-4">
                  {v.rateLepasKunci === null ? '—' : formatRupiah(v.rateLepasKunci)}
                </td>
                <td className="p-4">
                  {v.ratePelayanan === null ? '—' : formatRupiah(v.ratePelayanan)}
                </td>
```

Modify `src/components/admin/SettingsForm.tsx` — hapus isian `driverFeePerDay` beserta labelnya.

- [ ] **Step 6: Ubah data awal**

Modify `src/db/seed.ts` — pada array `armada`, ganti `rate24h`/`rate12h` menjadi `rateLepasKunci`/`ratePelayanan`. Bus dan Hiace diberi `rateLepasKunci: null`. Hapus `driverFeePerDay` dari `DEFAULT_SETTINGS` yang disisipkan.

- [ ] **Step 7: Sesuaikan tes integrasi admin**

Di `tests/integration/admin-vehicles.test.ts` dan `tests/integration/alur-penuh.test.ts`, ganti `rate24h`/`rate12h` menjadi `rateLepasKunci`/`ratePelayanan`, dan `rateType`/`driverDays` menjadi `rateCategory`. Ganti tes tarif 12 jam dengan:

```ts
  it('menolak kendaraan tanpa tarif sama sekali', async () => {
    bersesi();
    const hasil = await createVehicle({
      ...kendaraanBaru('Tanpa Tarif'),
      rateLepasKunci: null,
      ratePelayanan: null,
    });
    expect(hasil.ok).toBe(false);
  });
```

Pada `alur-penuh.test.ts`, sesuaikan asersi harga menjadi hitungan inklusif:

```ts
    // 15 sampai 20 = 6 hari inklusif.
    expect(row.totalPrice).toBe(6 * 800000);
```

- [ ] **Step 8: Jalankan seluruh tes**

Run: `npm test && npx tsc --noEmit`
Expected: semua lulus

- [ ] **Step 9: Commit**

```bash
git add src tests
git commit -m "feat: panel admin memakai dua kategori tarif, detail pesanan menangani rincian lama dan baru"
```

---

### Task 7: Menu baru

**Files:**
- Modify: `src/components/layout/nav-items.ts`, `src/i18n/messages/*.ts`
- Delete: `src/app/[locale]/travel/page.tsx`
- Modify: `src/app/sitemap.ts`
- Create: `scripts/sembunyikan-travel.mjs`
- Test: `tests/components/layout.test.tsx`

**Interfaces:**
- Consumes: `Messages` dari `@/i18n`
- Produces: `NAV_ITEMS` tanpa Travel dan Booking

- [ ] **Step 1: Ubah tes layout**

Di `tests/components/layout.test.tsx`, ganti daftar tautan yang diharapkan:

```tsx
  it('menampilkan seluruh tautan navigasi utama', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    for (const label of ['Beranda', 'Kendaraan', 'Testimoni', 'Tentang', 'Kontak']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('tidak lagi menampilkan menu Travel maupun Booking', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    expect(screen.queryByRole('link', { name: 'Travel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Booking' })).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Jalankan, pastikan gagal**

Run: `npm test -- tests/components/layout.test.tsx`
Expected: FAIL

- [ ] **Step 3: Ubah daftar menu**

Modify `src/components/layout/nav-items.ts`:

```ts
import type { Messages } from '@/i18n';

/**
 * Menu tumbuh bertahap: Ticketing, Tours, dan Terms menyusul bersama
 * halamannya di Tahap 2C dan 2D. Memasang tautan ke halaman yang belum ada
 * berarti menayangkan 404 di situs yang sedang dipakai.
 *
 * Booking sengaja bukan menu — alurnya selalu dimulai dari memilih kendaraan.
 */
export const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/mobil', key: 'vehicles' },
  { href: '/testimoni', key: 'testimonials' },
  { href: '/tentang', key: 'about' },
  { href: '/kontak', key: 'contact' },
] as const satisfies readonly { href: string; key: keyof Messages['nav'] }[];
```

- [ ] **Step 4: Hapus halaman travel dan sesuaikan sitemap**

```bash
git rm -r "src/app/[locale]/travel"
```

Modify `src/app/sitemap.ts` — hapus `'/travel'` dan `'/booking'` dari daftar `halaman` statis. Halaman booking tidak perlu diindeks karena bukan halaman tujuan pencarian.

- [ ] **Step 5: Sembunyikan rute travel yang tersimpan**

Create `scripts/sembunyikan-travel.mjs`:

```js
import { neon } from '@neondatabase/serverless';

/**
 * Menyembunyikan seluruh rute travel dari situs publik tanpa menghapus datanya,
 * agar keputusan menghapus menu Travel dapat dibalik kapan saja.
 *
 * Jalankan sekali: node --env-file=.env.local scripts/sembunyikan-travel.mjs
 */
const sql = neon(process.env.DATABASE_URL);
const hasil = await sql`update travel_routes set is_published = false returning destination`;
console.log(`${hasil.length} rute disembunyikan:`, hasil.map((r) => r.destination).join(', '));
```

Run: `node --env-file=.env.local scripts/sembunyikan-travel.mjs`
Expected: 4 rute disembunyikan.

- [ ] **Step 6: Hapus opsi travel dari form booking publik**

Seluruh rute kini tersembunyi, sehingga memilih "Antar-jemput / travel" pada form booking akan menampilkan daftar rute kosong — jalan buntu bagi pengunjung.

Modify `src/components/booking/BookingForm.tsx` — hapus baris opsi travel dari pemilih jenis layanan:

```tsx
            <option value="travel">{t.booking.travelService}</option>
```

Karena `adalahTravel` tidak akan pernah bernilai benar dari form publik, seluruh cabang travel di komponen ini menjadi kode mati. **Biarkan cabangnya** — Tahap 2C akan memakainya kembali untuk permintaan tur, dan menghapus lalu menulis ulang hanya menambah pekerjaan.

Modify `src/app/[locale]/booking/page.tsx` — teruskan `routes={[]}` alih-alih memanggil `getPublishedRoutes()`, dan hapus impornya.

Skema `bookingInputSchema` **tidak diubah**: cabang travel tetap sah agar Server Action bisa menerima permintaan tur pada Tahap 2C, dan agar pesanan travel lama tetap dapat divalidasi ulang bila perlu.

- [ ] **Step 7: Bersihkan kunci kamus yang tidak terpakai**

Di keempat `src/i18n/messages/*.ts`, hapus kunci `nav.travel` dan `nav.booking`, serta seluruh blok `travel`. Hapus juga `home.popularRoutes` dan keempat kunci layanan antar-jemput bila tidak lagi dipakai di beranda.

Modify `src/app/[locale]/page.tsx` — hapus bagian rute populer dan kartu layanan antar-jemput.

Pertahankan `nav.travel`? Tidak — hapus. Tetapi **pertahankan** `booking.travelService` dan blok `booking.route*`, karena Tahap 2C memakainya untuk permintaan tur.

- [ ] **Step 8: Jalankan tes, typecheck, dan build**

Run: `npm test && npx tsc --noEmit && npm run build`
Expected: semua lulus; `/[locale]/travel` tidak lagi muncul di daftar rute build.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: menu baru tanpa Travel dan Booking, rute travel disembunyikan"
```

---

### Task 8: Verifikasi produksi

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Jalankan seluruh tes tiga kali**

Run: `for i in 1 2 3; do npm test 2>&1 | grep -E "^ *Tests +[0-9]"; done`
Expected: tiga baris identik, semua lulus. Kalau ada yang berbeda, tesnya flaky dan harus ditelusuri sebelum lanjut.

- [ ] **Step 2: Perbarui README**

Modify `README.md` — pada bagian "Keputusan yang perlu diketahui", ganti penjelasan harga:

```markdown
**Harga: dua kategori per hari.** Lepas kunci (kendaraan saja) dan Pelayanan
(kendaraan + pengemudi + BBM). Customer memilih satu untuk seluruh sewa.
Hitungan hari **inklusif**: 15 sampai 17 Agustus = 3 hari.

**Pesanan Fase 1 memakai model lama** (24 jam / 12 jam dengan biaya sopir
terpisah) dan sengaja dibiarkan apa adanya. `adalahRincianLama()` di
`src/db/schema.ts` membedakan kedua bentuk rincian.
```

- [ ] **Step 3: Commit dan dorong**

```bash
git add README.md
git commit -m "docs: README mengikuti model harga dua kategori"
git push origin main
```

- [ ] **Step 4: Tunggu deploy dan verifikasi produksi**

```bash
until curl -s https://lians.id/mobil | grep -q "Lepas kunci"; do sleep 20; done
echo "model harga baru sudah tayang"
```

- [ ] **Step 5: Periksa produksi**

```bash
for p in "/" "/mobil" "/booking" "/testimoni" "/tentang" "/kontak" "/sitemap.xml"; do
  printf "%-14s %s\n" "$p" "$(curl -s -o /dev/null -w '%{http_code}' https://lians.id$p)"
done
printf "travel harus 404: "; curl -s -o /dev/null -w "%{http_code}\n" https://lians.id/travel
printf "sitemap tanpa travel: "; curl -s https://lians.id/sitemap.xml | grep -c "/travel"
```

Expected: seluruh halaman 200; `/travel` mengembalikan 404; sitemap tidak memuat travel.

- [ ] **Step 6: Isi tarif pelayanan lewat panel admin**

Buka `admin.lians.id/armada`, buka tiap kendaraan, isi **Tarif pelayanan** yang sebelumnya kosong. Sampai diisi, kendaraan itu hanya bisa dipesan sebagai lepas kunci.

Ini pekerjaan pemilik, bukan pekerjaan kode — angkanya keputusan bisnis.
