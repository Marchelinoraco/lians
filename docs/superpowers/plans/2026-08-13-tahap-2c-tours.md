# Tahap 2C — Tours: Paket Statis Empat Bahasa

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menayangkan dua belas paket wisata LIANS sebagai halaman yang terbaca dalam empat bahasa, tanpa harga, tanpa database, dan tanpa CRUD — isinya berkas TypeScript di dalam repo — berikut satu formulir permintaan tur yang tersimpan dan terbaca di panel admin.

**Architecture:** Paket adalah data statis. Tidak ada tabel, tidak ada kueri, tidak ada halaman admin untuk mengubahnya; mengubah paket berarti menyunting berkas dan menerbitkan ulang. Karena datanya statis, kedua halaman publik dapat dibuat sepenuhnya saat build (SSG) lewat `generateStaticParams` — lebih cepat dan lebih murah daripada armada yang memang harus dinamis. Yang tetap dinamis hanyalah permintaan tur yang masuk, karena itu bukan konten melainkan pesanan.

**Tech Stack:** Next.js 16 · TypeScript strict · Drizzle ORM (hanya untuk permintaan tur) · Zod 4 · Tailwind CSS 4 · Vitest

**Sumber data:** `docs/superpowers/specs/2026-08-13-data-paket-tours.md`

## Global Constraints

- Direktori kerja: `/Users/marchelinoraco/Documents/2026/lians/lians-web`. Situs **sedang tayang**.
- **Tidak ada harga di mana pun.** Tidak ada kolom harga, tidak ada label "mulai dari", tidak ada angka rupiah pada paket. Semua paket mengarah ke WhatsApp untuk penawaran. Ini keputusan pemilik, bukan kekurangan data.
- **Paket statis.** Tidak ada tabel `tourPackages`, tidak ada Server Action untuk paket, tidak ada menu admin untuk paket.
- **Empat bahasa lengkap** untuk setiap paket: `id`, `en`, `zh`, `ko`. Bahasa Indonesia wajib; tiga lainnya diisi penuh, bukan dibiarkan jatuh ke bawaan.
- Semua fakta wajib berasal dari `docs/superpowers/specs/2026-08-13-data-paket-tours.md`. **Fakta baru tidak boleh dikarang** — tidak ada jam yang tidak tercatat, tidak ada fasilitas yang tidak terdaftar, tidak ada nama hotel.
- Foto belum ada. Halaman wajib tetap rapi tanpa foto, dan menerima foto begitu berkasnya ditaruh di `public/tours/<slug>/`.
- TypeScript `strict`, tanpa `any`. Path alias `@/*` → `src/*`.
- Commit tiap akhir tugas, pesan berbahasa Indonesia.

## Aturan Menulis

Kalimat dikembangkan dari data faktual, bukan disalin dari sumber mana pun. Yang membedakan tulisan yang baik di sini:

1. **Konkret mengalahkan superlatif.** "Kapal dua dek dengan toilet di dalamnya" — bukan "kapal mewah nan nyaman". Pembaca sedang memutuskan akan menghabiskan satu hari di atas kapal; ia butuh tahu ada toilet, bukan kata sifat.
2. **Tulis apa yang benar-benar dialami pembaca.** Pasir timbul Nain hanya muncul saat air surut. Perjalanan ke Lihaga lewat Dermaga Serei, bukan dari Manado. Hal semacam ini yang dicari orang dan tidak ditemukan di brosur.
3. **Jujur tentang usahanya.** Open trip berarti berbagi kapal dengan rombongan lain. Trip lima hari berarti lima pagi bangun awal. Menyembunyikannya menghasilkan tamu yang kecewa di lapangan, dan tamu kecewa lebih mahal daripada tamu yang tidak jadi memesan.
4. **Tanpa desakan palsu.** Tidak ada "buruan!", "jangan sampai kehabisan!", atau harga coret. Tidak ada janji cuaca.
5. **Terjemahan ditulis, bukan dialihbahasakan kata per kata.** Versi Mandarin dan Korea harus terbaca seperti ditulis penutur aslinya. Nama tempat tetap dalam ejaan aslinya (Bunaken, Siladen, Likupang) karena itulah yang tertulis di papan dan tiket; keterangan di sekitarnya yang diterjemahkan.
6. **Panjang yang wajar:** `intro` dua paragraf pendek, `highlights` tiga sampai lima butir, `days` mengikuti jumlah hari sebenarnya.

## Peta Berkas

```
src/data/tours/types.ts              ← BARU: tipe TourPackage
src/data/tours/index.ts              ← BARU: daftar, getTourBySlug, TOUR_SLUGS
src/data/tours/<slug>.ts             ← BARU: 12 berkas, satu per paket
src/components/tour/TourCard.tsx     ← BARU
src/components/tour/TourGallery.tsx  ← BARU
src/components/tour/TourItinerary.tsx ← BARU
src/components/tour/TourRequestForm.tsx ← BARU
src/app/[locale]/tours/page.tsx      ← BARU
src/app/[locale]/tours/[slug]/page.tsx ← BARU
src/schemas/tour-request.ts          ← BARU
src/actions/tour-request.ts          ← BARU
src/queries/tour-requests.ts         ← BARU
src/app/admin/permintaan-tur/        ← BARU
src/db/schema.ts                     ← tabel tourRequests
src/i18n/messages/*.ts               ← bagian `tours` di empat kamus
src/components/layout/nav-items.ts   ← menu Tours
```

Satu berkas per paket, bukan satu berkas raksasa: tiap paket berisi empat bahasa dan menjadi ratusan baris sendiri. Dipisah begini, menyunting satu paket tidak berarti menggulung sebelas paket lain.

---

### Task 1: Tipe data dan paket pertama

**Files:**
- Create: `src/data/tours/types.ts`, `src/data/tours/index.ts`, `src/data/tours/open-trip-6-spot.ts`
- Test: `tests/unit/tours-data.test.ts`

**Interfaces:**
- Consumes: `Localized<T>`, `Locale`, `LOCALES` dari `@/i18n`
- Produces:
  - `type TourPackage`, `type TourDay`, `type TourStep` dari `@/data/tours/types`
  - `TOUR_PACKAGES: TourPackage[]`, `getTourBySlug(slug): TourPackage | null`, `TOUR_SLUGS: string[]` dari `@/data/tours`

- [ ] **Step 1: Tipe paket**

Create `src/data/tours/types.ts`:

```ts
import type { Localized } from '@/i18n';

/**
 * Satu langkah dalam rangkaian acara. `time` opsional dan sengaja begitu:
 * sebagian paket menerbitkan jamnya, sebagian hanya urutannya. Mengarang jam
 * untuk yang tidak punya berarti menjanjikan ketepatan yang tidak ada.
 */
export type TourStep = {
  time?: string;
  title: Localized<string>;
};

export type TourDay = {
  label: Localized<string>;
  steps: TourStep[];
};

export type TourCategory = 'open-trip' | 'one-day' | 'multi-day';

/**
 * Paket wisata sebagai data statis.
 *
 * Tidak ada kolom harga di sini, dan itu disengaja: seluruh paket mengarah ke
 * WhatsApp untuk penawaran. Menambahkan harga kelak berarti menambah kolom,
 * bukan mengisi kolom yang dibiarkan kosong.
 */
export type TourPackage = {
  slug: string;
  category: TourCategory;
  /** Untuk pengurutan dan label "1 hari" / "3 hari 2 malam". */
  days: number;
  nights: number;
  name: Localized<string>;
  tagline: Localized<string>;
  duration: Localized<string>;
  destinations: Localized<string[]>;
  intro: Localized<string[]>;
  highlights: Localized<string[]>;
  itinerary: TourDay[];
  includes: Localized<string[]>;
  excludes: Localized<string[]>;
  meetingPoint?: Localized<string>;
  notes?: Localized<string[]>;
  /**
   * Nama berkas di dalam `public/tours/<slug>/`. Boleh kosong — halaman tetap
   * rapi tanpa foto, dan foto tinggal ditaruh di folder itu kemudian.
   */
  images: string[];
  sortOrder: number;
};
```

- [ ] **Step 2: Tulis tes yang gagal**

Create `tests/unit/tours-data.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { LOCALES } from '@/i18n';
import { TOUR_PACKAGES, TOUR_SLUGS, getTourBySlug } from '@/data/tours';

describe('data paket tours', () => {
  it('memuat paket dan slug yang unik', () => {
    expect(TOUR_PACKAGES.length).toBeGreaterThan(0);
    expect(new Set(TOUR_SLUGS).size).toBe(TOUR_SLUGS.length);
  });

  it('menemukan paket lewat slug dan mengembalikan null untuk slug asing', () => {
    expect(getTourBySlug(TOUR_SLUGS[0])?.slug).toBe(TOUR_SLUGS[0]);
    expect(getTourBySlug('tidak-ada')).toBeNull();
  });

  it('slug hanya huruf kecil, angka, dan tanda hubung', () => {
    for (const s of TOUR_SLUGS) expect(s).toMatch(/^[a-z0-9-]+$/);
  });

  // Terjemahan yang kosong akan jatuh ke bahasa Indonesia dan menghasilkan
  // halaman setengah Indonesia setengah asing — lebih buruk daripada bolong.
  it('setiap paket lengkap dalam empat bahasa', () => {
    for (const p of TOUR_PACKAGES) {
      for (const l of LOCALES) {
        expect(p.name[l], `${p.slug}.name.${l}`).toBeTruthy();
        expect(p.tagline[l], `${p.slug}.tagline.${l}`).toBeTruthy();
        expect(p.duration[l], `${p.slug}.duration.${l}`).toBeTruthy();
        expect(p.intro[l]?.length, `${p.slug}.intro.${l}`).toBeGreaterThan(0);
        expect(p.highlights[l]?.length, `${p.slug}.highlights.${l}`).toBeGreaterThan(0);
        expect(p.destinations[l]?.length, `${p.slug}.destinations.${l}`).toBeGreaterThan(0);
        expect(p.includes[l]?.length, `${p.slug}.includes.${l}`).toBeGreaterThan(0);
        expect(p.excludes[l]?.length, `${p.slug}.excludes.${l}`).toBeGreaterThan(0);
      }
    }
  });

  it('setiap langkah rangkaian acara lengkap dalam empat bahasa', () => {
    for (const p of TOUR_PACKAGES) {
      for (const hari of p.itinerary) {
        for (const l of LOCALES) {
          expect(hari.label[l], `${p.slug}.hari.${l}`).toBeTruthy();
        }
        for (const step of hari.steps) {
          for (const l of LOCALES) {
            expect(step.title[l], `${p.slug}.langkah.${l}`).toBeTruthy();
          }
        }
      }
    }
  });

  it('jumlah hari pada rangkaian acara cocok dengan kolom days', () => {
    for (const p of TOUR_PACKAGES) {
      if (p.itinerary.length === 0) continue;
      expect(p.itinerary.length, p.slug).toBe(p.days);
    }
  });

  // Harga adalah keputusan pemilik: seluruh paket mengarah ke WhatsApp.
  // Tes ini menahan kolom harga agar tidak diam-diam masuk kembali.
  it('tidak ada paket yang memuat kolom harga', () => {
    for (const p of TOUR_PACKAGES) {
      const kunci = Object.keys(p);
      expect(kunci.some((k) => /price|harga|rate|cost/i.test(k)), p.slug).toBe(false);
    }
  });
});
```

- [ ] **Step 3: Jalankan, pastikan gagal**

Run: `npx vitest run tests/unit/tours-data.test.ts`
Expected: FAIL — `@/data/tours` belum ada

- [ ] **Step 4: Tulis paket pertama**

Create `src/data/tours/open-trip-6-spot.ts`. Ini contoh bentuk untuk sebelas paket berikutnya — perhatikan bahwa tiga pilihan (tur saja, tur + snorkeling, tur + diving) tetap disebut sebagai pilihan, hanya angkanya yang tidak:

```ts
import type { TourPackage } from './types';

export const openTrip6Spot: TourPackage = {
  slug: 'open-trip-6-spot',
  category: 'open-trip',
  days: 1,
  nights: 0,
  sortOrder: 10,
  images: [],

  name: {
    id: 'Open Trip 6 Spot — Bunaken, Nain, Siladen',
    en: 'Open Trip, Six Stops — Bunaken, Nain, Siladen',
    zh: '布纳肯、纳因、西拉登 六站拼船一日游',
    ko: '부나켄·나인·실라덴 6개 스팟 오픈 트립',
  },

  tagline: {
    id: 'Satu hari, enam titik, satu kapal bersama.',
    en: 'One day, six stops, one shared boat.',
    zh: '一天，六个停靠点，一艘拼船。',
    ko: '하루, 여섯 곳, 한 배에 함께.',
  },

  duration: {
    id: '1 hari · 07.30–17.00 WITA',
    en: 'Full day · 07:30–17:00 WITA',
    zh: '全天 · 07:30–17:00（WITA）',
    ko: '1일 · 07:30–17:00 (WITA)',
  },

  destinations: {
    id: ['Bunaken', 'Nain', 'Siladen', 'New Bunaken'],
    en: ['Bunaken', 'Nain', 'Siladen', 'New Bunaken'],
    zh: ['布纳肯', '纳因', '西拉登', '新布纳肯'],
    ko: ['부나켄', '나인', '실라덴', '뉴 부나켄'],
  },

  intro: {
    id: [
      'Kapal lepas dari Dermaga Megamas pukul delapan pagi dan baru merapat lagi menjelang sore. Di antaranya ada enam titik: perairan Bunaken yang membuat Manado dikenal penyelam sedunia, pasir timbul Nain yang hanya muncul dari laut saat air surut, pantai Siladen, dan New Bunaken.',
      'Ini open trip — Anda bergabung dengan peserta lain di kapal dua dek, bukan menyewa satu kapal untuk rombongan sendiri. Itu yang membuatnya jauh lebih ringan daripada trip privat, dan itu pula yang membuat harinya ramai: biasanya campur, ada yang datang berdua, ada yang serombongan kantor. Kru menyiapkan makan siang di atas kapal, dan dokumentasi foto sudah termasuk — tidak perlu menitipkan ponsel ke orang asing demi satu foto yang layak dibawa pulang.',
    ],
    en: [
      'The boat leaves Megamas pier at eight in the morning and does not dock again until late afternoon. In between are six stops: the Bunaken waters that put Manado on every diver’s map, the Nain sandbar that surfaces only at low tide, Siladen beach, and New Bunaken.',
      'This is an open trip — you join other travellers on a two-deck boat rather than chartering one for your own group. That is what makes it far lighter on the wallet than a private trip, and also what makes the day sociable: usually a mix, some couples, some office groups. The crew serves lunch on board, and photography is included — no handing your phone to a stranger for one usable picture.',
    ],
    zh: [
      '船早上八点从美嘉码头出发，直到傍晚才返港。中间停靠六处：让万鸦老在潜水界闻名的布纳肯海域、只在退潮时浮出海面的纳因沙洲、西拉登海滩，以及新布纳肯。',
      '这是拼船团——您与其他旅客同乘一艘双层船，而不是包下整船。费用因此比包船低得多，一天也因此热闹：通常是混合团，有情侣，也有公司同事。船员在船上备好午餐，摄影已含在内，不必把手机交给陌生人只为拍一张能带回家的照片。',
    ],
    ko: [
      '배는 아침 여덟 시에 메가마스 선착장을 떠나 늦은 오후에야 다시 정박합니다. 그 사이 여섯 곳에 들릅니다. 마나도를 다이버들의 지도에 올려놓은 부나켄 해역, 썰물 때만 바다 위로 드러나는 나인 모래톱, 실라덴 해변, 그리고 뉴 부나켄입니다.',
      '오픈 트립입니다. 배를 통째로 빌리는 것이 아니라 2층 배에 다른 여행자들과 함께 탑니다. 그래서 전세 트립보다 훨씬 부담이 적고, 하루가 북적입니다. 보통은 섞여 있습니다. 둘이 온 사람도, 회사 단체도 있습니다. 선원이 배 위에서 점심을 준비하고 사진 촬영도 포함되어 있습니다. 가져갈 만한 사진 한 장을 위해 낯선 사람에게 휴대폰을 맡길 필요가 없습니다.',
    ],
  },

  highlights: {
    id: [
      'Enam titik dalam satu hari pelayaran',
      'Kapal dua dek, ada toilet dan area teduh',
      'Makan siang dan dokumentasi foto sudah termasuk',
      'Tiga pilihan: ikut tur saja, tur dengan snorkeling, atau tur dengan diving',
    ],
    en: [
      'Six stops in a single day at sea',
      'Two-deck boat with a toilet and shaded seating',
      'Lunch and photo documentation included',
      'Three ways to join: sightseeing only, with snorkelling, or with diving',
    ],
    zh: [
      '一天航程停靠六处',
      '双层船，配有卫生间与遮阳区',
      '含午餐与摄影记录',
      '三种参加方式：纯游览、含浮潜、含潜水',
    ],
    ko: [
      '하루 항해로 여섯 곳',
      '화장실과 그늘 좌석을 갖춘 2층 배',
      '점심과 사진 촬영 포함',
      '세 가지 선택: 관광만, 스노클링 포함, 다이빙 포함',
    ],
  },

  // Sumber hanya menerbitkan jam berangkat dan jam kembali, bukan jadwal
  // rinci per titik. Ditulis apa adanya; sisanya tidak dikarang.
  itinerary: [
    {
      label: { id: 'Sepanjang hari', en: 'Across the day', zh: '全天行程', ko: '하루 일정' },
      steps: [
        {
          time: '07.30',
          title: {
            id: 'Berkumpul di Dermaga Manado Bay Megamas, di belakang gedung HOKBEN',
            en: 'Meet at Manado Bay Megamas pier, behind the HOKBEN building',
            zh: '在美嘉万鸦老湾码头集合，HOKBEN 大楼后方',
            ko: '마나도 베이 메가마스 선착장 집합, HOKBEN 건물 뒤편',
          },
        },
        {
          time: '08.00',
          title: {
            id: 'Kapal berangkat menuju titik pertama',
            en: 'The boat departs for the first stop',
            zh: '船只启航前往第一站',
            ko: '첫 번째 스팟을 향해 출항',
          },
        },
        {
          title: {
            id: 'Enam titik: Bunaken, Nain, Siladen, New Bunaken, dan titik snorkeling atau diving',
            en: 'Six stops: Bunaken, Nain, Siladen, New Bunaken, and the snorkelling or diving site',
            zh: '六个停靠点：布纳肯、纳因、西拉登、新布纳肯，以及浮潜或潜水点',
            ko: '여섯 스팟: 부나켄, 나인, 실라덴, 뉴 부나켄, 그리고 스노클링 또는 다이빙 포인트',
          },
        },
        {
          title: {
            id: 'Makan siang disiapkan kru di atas kapal',
            en: 'Lunch prepared by the crew on board',
            zh: '船员在船上准备午餐',
            ko: '선원이 배 위에서 점심 준비',
          },
        },
        {
          time: '17.00',
          title: {
            id: 'Kembali merapat di Manado',
            en: 'Back at the Manado pier',
            zh: '返回万鸦老码头',
            ko: '마나도 선착장 귀항',
          },
        },
      ],
    },
  ],

  includes: {
    id: [
      'Kapal dua dek (berbagi dengan peserta lain)',
      'Kru dan nakhoda',
      'Makan siang',
      'Pemandu wisata',
      'Asuransi pelayaran',
      'Dokumentasi foto',
      'Karaoke di kapal',
    ],
    en: [
      'Two-deck boat, shared with other travellers',
      'Crew and skipper',
      'Lunch',
      'Tour guide',
      'Marine travel insurance',
      'Photo documentation',
      'Karaoke on board',
    ],
    zh: [
      '双层船（与其他旅客拼船）',
      '船员与船长',
      '午餐',
      '导游',
      '航行保险',
      '摄影记录',
      '船上卡拉OK',
    ],
    ko: [
      '2층 배 (다른 여행자와 함께 탑승)',
      '선원과 선장',
      '점심',
      '투어 가이드',
      '해상 여행자 보험',
      '사진 촬영',
      '선상 노래방',
    ],
  },

  excludes: {
    id: ['Tip untuk pemandu dan kru (sukarela)'],
    en: ['Tips for the guide and crew (at your discretion)'],
    zh: ['导游与船员小费（自愿）'],
    ko: ['가이드와 선원 팁 (자율)'],
  },

  meetingPoint: {
    id: 'Dermaga Manado Bay Megamas, di belakang gedung HOKBEN',
    en: 'Manado Bay Megamas pier, behind the HOKBEN building',
    zh: '美嘉万鸦老湾码头，HOKBEN 大楼后方',
    ko: '마나도 베이 메가마스 선착장, HOKBEN 건물 뒤편',
  },

  notes: {
    id: [
      'Open trip berangkat pada tanggal yang sudah dijadwalkan, bukan setiap hari. Hubungi kami untuk tanggal terdekat.',
      'Pasir timbul Nain hanya muncul saat air surut, sehingga tampak berbeda dari satu perjalanan ke perjalanan lain.',
    ],
    en: [
      'Open trips run on scheduled dates rather than daily. Message us for the nearest departure.',
      'The Nain sandbar surfaces only at low tide, so it looks different from one trip to the next.',
    ],
    zh: [
      '拼船团按既定日期发船，并非每日出发。请联系我们查询最近班次。',
      '纳因沙洲只在退潮时浮现，因此每次航程所见都不相同。',
    ],
    ko: [
      '오픈 트립은 매일이 아니라 정해진 날짜에 출발합니다. 가장 가까운 출발일은 문의해 주세요.',
      '나인 모래톱은 썰물 때만 드러나므로 매번 다른 모습을 보입니다.',
    ],
  },
};
```

- [ ] **Step 5: Daftar paket**

Create `src/data/tours/index.ts`:

```ts
import type { TourPackage } from './types';
import { openTrip6Spot } from './open-trip-6-spot';

/**
 * Paket disusun manual, bukan dipindai dari folder: urutannya menentukan
 * urutan tampil, dan impor eksplisit membuat paket yang belum siap tayang
 * cukup dikeluarkan dari daftar ini tanpa menghapus berkasnya.
 */
export const TOUR_PACKAGES: TourPackage[] = [openTrip6Spot].sort(
  (a, b) => a.sortOrder - b.sortOrder,
);

export const TOUR_SLUGS: string[] = TOUR_PACKAGES.map((p) => p.slug);

export function getTourBySlug(slug: string): TourPackage | null {
  return TOUR_PACKAGES.find((p) => p.slug === slug) ?? null;
}

export type { TourPackage, TourDay, TourStep, TourCategory } from './types';
```

- [ ] **Step 6: Jalankan, pastikan lulus**

Run: `npx vitest run tests/unit/tours-data.test.ts`
Expected: PASS, 7 tes

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: tipe data paket tours statis dan paket pertama"
```

---

### Task 2: Sebelas paket sisanya

**Files:**
- Create: `src/data/tours/` — sebelas berkas paket
- Modify: `src/data/tours/index.ts`

**Interfaces:**
- Consumes: `TourPackage` dari `./types`
- Produces: `TOUR_PACKAGES` berisi dua belas paket

Setiap paket mengikuti persis bentuk `open-trip-6-spot.ts` pada Task 1, dengan fakta diambil dari bagian yang bersesuaian di `docs/superpowers/specs/2026-08-13-data-paket-tours.md` dan kalimat ditulis mengikuti **Aturan Menulis** di atas.

| Berkas | `slug` | `category` | `days` / `nights` | `sortOrder` |
|---|---|---|---|---|
| `sunset-manado.ts` | `sunset-manado` | `open-trip` | 1 / 0 | 20 |
| `one-day-bunaken.ts` | `one-day-bunaken` | `one-day` | 1 / 0 | 30 |
| `one-day-nain-siladen-bunaken.ts` | `one-day-nain-siladen-bunaken` | `one-day` | 1 / 0 | 40 |
| `one-day-lihaga.ts` | `one-day-lihaga` | `one-day` | 1 / 0 | 50 |
| `one-day-minahasa-highland.ts` | `one-day-minahasa-highland` | `one-day` | 1 / 0 | 60 |
| `2h1m-bunaken-minahasa.ts` | `2h1m-bunaken-minahasa` | `multi-day` | 2 / 1 | 70 |
| `2h1m-bunaken-nain-siladen.ts` | `2h1m-bunaken-nain-siladen` | `multi-day` | 2 / 1 | 80 |
| `3h2m-minahasa-tiga-pulau.ts` | `3h2m-minahasa-tiga-pulau` | `multi-day` | 3 / 2 | 90 |
| `3h2m-kek-likupang.ts` | `3h2m-kek-likupang` | `multi-day` | 3 / 2 | 100 |
| `4h3m-bunaken-likupang-minahasa.ts` | `4h3m-bunaken-likupang-minahasa` | `multi-day` | 4 / 3 | 110 |
| `5h4m-likupang-lihaga-bunaken-minahasa.ts` | `5h4m-likupang-lihaga-bunaken-minahasa` | `multi-day` | 5 / 4 | 120 |

Catatan isi yang tidak boleh terlewat:

- **`sunset-manado`** — tiga jam sore, minimum sepuluh peserta. Minimum itu wajib disebut di `notes`: pembaca yang datang berdua perlu tahu keberangkatan bergantung pada peserta lain. Larangan membawa minuman dari luar masuk ke `excludes`.
- **`one-day-lihaga`** — tiga varian (A berkumpul di Dermaga Serei pukul 09.00 tanpa transportasi darat; B dan C dijemput di hotel/Megamas pukul 07.00). Ditulis di `notes` sebagai pilihan, bukan dibuat tiga paket terpisah.
- **`one-day-bunaken`** dan **`one-day-nain-siladen-bunaken`** — sewa alat snorkeling dan diving masuk `excludes` **tanpa angka**, sesuai aturan tanpa harga.
- **`2h1m-bunaken-nain-siladen`** — menginap di resort di Pulau Bunaken, bukan hotel di kota. Perbedaan itu penting bagi tamu dan wajib jelas di `intro`.
- **`3h2m-minahasa-tiga-pulau`** — ketentuan DP 50% di sumber adalah kebijakan pemasok, bukan kebijakan LIANS. **Jangan dicantumkan.**
- Paket empat dan lima hari — `itinerary` memakai satu `TourDay` per hari, `label` diisi "Hari 1 — Minahasa Highland" dan seterusnya.

- [ ] **Step 1: Tulis sebelas berkas paket**

Ikuti bentuk Task 1 Step 4 untuk masing-masing, dengan fakta dari dokumen sumber pada bagian bernomor yang sama.

- [ ] **Step 2: Daftarkan semuanya**

Modify `src/data/tours/index.ts` — impor kedua belas paket dan masukkan ke `TOUR_PACKAGES`.

- [ ] **Step 3: Jalankan tes**

Run: `npx vitest run tests/unit/tours-data.test.ts`
Expected: PASS. Tes kelengkapan empat bahasa berjalan atas kedua belas paket, jadi satu terjemahan yang terlewat menggagalkannya dengan menyebut slug dan bahasanya.

- [ ] **Step 4: Pastikan tidak ada angka rupiah yang lolos**

Run: `grep -rnE "Rp ?[0-9]|[0-9]{3}\.000|rupiah" src/data/tours/ || echo "bersih"`
Expected: `bersih`

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: sebelas paket tours sisanya dalam empat bahasa"
```

---

### Task 3: Kamus dan navigasi

**Files:**
- Modify: `src/i18n/messages/id.ts`, `en.ts`, `zh.ts`, `ko.ts`, `src/components/layout/nav-items.ts`

**Interfaces:**
- Produces: `Messages['nav']['tours']`, `Messages['tours']`

- [ ] **Step 1: Tambahkan bagian tours ke kamus Indonesia**

Modify `src/i18n/messages/id.ts` — pada `nav`, tambahkan `tours: 'Tours',`. Lalu tambahkan bagian baru setelah `catalog`:

```ts
  tours: {
    title: 'Paket Wisata',
    subtitle:
      'Bunaken, Nain, Siladen, Lihaga, Likupang, dan dataran tinggi Minahasa — dari sehari sampai lima hari. Hubungi kami untuk penawaran.',
    allCategories: 'Semua paket',
    openTrip: 'Open trip',
    oneDay: 'Sehari',
    multiDay: 'Menginap',
    durationLabel: 'Durasi',
    destinationsLabel: 'Destinasi',
    highlightsLabel: 'Yang membuatnya menarik',
    itineraryLabel: 'Rangkaian acara',
    includesLabel: 'Sudah termasuk',
    excludesLabel: 'Belum termasuk',
    meetingPointLabel: 'Titik kumpul',
    notesLabel: 'Perlu diketahui',
    askPrice: 'Tanyakan harga lewat WhatsApp',
    requestTitle: 'Minta penawaran',
    requestSubtitle:
      'Isi jumlah peserta dan tanggalnya, kami balas dengan harga dan ketersediaan.',
    viewPackage: 'Lihat paket',
    empty: 'Belum ada paket pada kategori ini.',
    photoComingSoon: 'Foto menyusul',
  },
```

Tiga kamus lain menyalin **bentuknya**, bukan isinya. Kunci yang terlewat menggagalkan `npm run build` lewat `type Messages = typeof id` — itu memang gunanya.

- [ ] **Step 2: Terjemahkan ke tiga bahasa**

Modify `en.ts`, `zh.ts`, `ko.ts` — tambahkan `tours: '…'` pada `nav` dan bagian `tours` lengkap.

- [ ] **Step 3: Pasang menu**

Modify `src/components/layout/nav-items.ts`:

```ts
export const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/mobil', key: 'vehicles' },
  { href: '/tours', key: 'tours' },
  { href: '/testimoni', key: 'testimonials' },
  { href: '/tentang', key: 'about' },
  { href: '/kontak', key: 'contact' },
] as const satisfies readonly { href: string; key: keyof Messages['nav'] }[];
```

Perbarui juga komentar di atasnya: Tours sudah tayang, tinggal Ticketing dan Terms.

- [ ] **Step 4: Verifikasi kontrak kamus**

Run: `npx tsc --noEmit`
Expected: lulus. Untuk membuktikan kontraknya hidup, hapus sementara satu kunci `tours` di `ko.ts`, jalankan lagi, pastikan gagal dengan `TS2741`, lalu kembalikan.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: kamus tours empat bahasa dan menu Tours"
```

---

### Task 4: Halaman daftar dan detail

**Files:**
- Create: `src/components/tour/TourCard.tsx`, `TourGallery.tsx`, `TourItinerary.tsx`, `src/app/[locale]/tours/page.tsx`, `src/app/[locale]/tours/[slug]/page.tsx`

**Interfaces:**
- Consumes: `TOUR_PACKAGES`, `getTourBySlug`, `TOUR_SLUGS` dari `@/data/tours`; `pickLocale`, `getMessages` dari `@/i18n`
- Produces: `<TourCard tour locale />`, `<TourGallery images alt emptyLabel />`, `<TourItinerary days locale label />`

- [ ] **Step 1: Galeri**

Create `src/components/tour/TourGallery.tsx` — pola yang sama dengan `VehicleGallery`, tetapi menerima nama berkas dan menyusun jalurnya sendiri:

```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';

export function TourGallery({
  slug,
  images,
  alt,
  emptyLabel,
}: {
  slug: string;
  images: string[];
  alt: string;
  emptyLabel: string;
}) {
  const [aktif, setAktif] = useState(0);

  // Foto belum tentu ada. Halaman tetap utuh tanpanya, dan foto tinggal
  // ditaruh di public/tours/<slug>/ tanpa menyentuh kode.
  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-gradient-to-br from-lians-50 to-slate-100 text-center text-muted">
        {emptyLabel}
      </div>
    );
  }

  const jalur = (berkas: string) => `/tours/${slug}/${berkas}`;

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={jalur(images[aktif])}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((berkas, i) => (
            <li key={berkas}>
              <button
                type="button"
                onClick={() => setAktif(i)}
                aria-label={`${alt} — ${i + 1}`}
                aria-current={i === aktif}
                className={cn(
                  'relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2',
                  i === aktif ? 'border-lians-500' : 'border-transparent',
                )}
              >
                <Image src={jalur(berkas)} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Kartu dan rangkaian acara**

Create `src/components/tour/TourCard.tsx` — kartu tanpa harga, menampilkan nama, tagline, durasi, dan destinasi, menaut ke `/tours/<slug>` lewat `localePath`.

Create `src/components/tour/TourItinerary.tsx` — daftar hari dan langkah; `time` ditampilkan sebagai kolom kiri bila ada, dan langkah tanpa jam tetap sejajar rapi.

- [ ] **Step 3: Halaman daftar**

Create `src/app/[locale]/tours/page.tsx`. Karena datanya statis, halaman ini dibuat penuh saat build:

```tsx
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}
```

Tanpa `revalidate` dan tanpa `force-dynamic`: tidak ada yang bisa berubah tanpa penerbitan ulang.

- [ ] **Step 4: Halaman detail**

Create `src/app/[locale]/tours/[slug]/page.tsx` dengan `generateStaticParams` atas seluruh kombinasi bahasa × slug, `generateMetadata` per bahasa, dan `notFound()` untuk slug asing.

- [ ] **Step 5: Verifikasi**

Run: `npx tsc --noEmit && npm run build`
Expected: build sukses, dan `/[locale]/tours` serta `/[locale]/tours/[slug]` muncul sebagai **●** (SSG), bukan ƒ. Jumlah halaman bertambah 4 + (4 × 12) = 52.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: halaman daftar dan detail paket tours"
```

---

### Task 5: Formulir permintaan tur

**Files:**
- Create: `src/schemas/tour-request.ts`, `src/actions/tour-request.ts`, `src/queries/tour-requests.ts`, `src/components/tour/TourRequestForm.tsx`
- Modify: `src/db/schema.ts`, `src/app/[locale]/tours/[slug]/page.tsx`
- Test: `tests/integration/tour-request.test.ts`

**Interfaces:**
- Consumes: `cocokkanAtauBuatPelanggan` dari `@/lib/customer-match`; `checkRateLimit` dari `@/lib/rate-limit`; `waLink` dari `@/lib/whatsapp`
- Produces: tabel `tourRequests`; `createTourRequest(input)` → `ActionResult<{ requestCode; whatsappUrl }>`

Permintaan tur adalah pesanan, bukan konten — karena itu tetap tersimpan di database meski paketnya statis. Nama paket **disalin** ke dalam permintaan, sama seperti nama kendaraan pada pesanan: mengganti judul paket kelak tidak boleh mengubah isi permintaan lama.

- [ ] **Step 1: Tabel**

Modify `src/db/schema.ts`:

```ts
export const tourRequests = pgTable('tour_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestCode: text('request_code').notNull().unique(),
  // Slug paket, bukan foreign key: paketnya statis di dalam repo, tidak ada
  // tabel yang bisa dirujuk. Nama disalin di kolom berikutnya.
  tourSlug: text('tour_slug').notNull(),
  tourNameSnapshot: text('tour_name_snapshot').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  pax: integer('pax').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type TourRequest = typeof tourRequests.$inferSelect;
```

- [ ] **Step 2: Skema validasi**

Create `src/schemas/tour-request.ts` — `tourSlug` wajib dan harus ada di `TOUR_SLUGS`, `pax` bilangan bulat 1–60, `startDate` wajib, `endDate` opsional dan tidak boleh mendahului `startDate`, data pelanggan seperti pada `bookingInputSchema`.

- [ ] **Step 3: Server Action**

Create `src/actions/tour-request.ts` — pola yang sama persis dengan `createBooking`: pembatas laju per IP, validasi, cocokkan pelanggan, simpan, lalu kembalikan tautan WhatsApp berisi ringkasan berbahasa Indonesia. **Tanpa harga** dalam pesannya; yang dikirim adalah nama paket, jumlah peserta, tanggal, dan catatan.

- [ ] **Step 4: Formulir**

Create `src/components/tour/TourRequestForm.tsx` — `Tours` (terkunci pada paket yang sedang dibuka), `Jumlah Pax`, `Tanggal Mulai`, `Tanggal Selesai`, lalu nama, WhatsApp, email opsional, dan catatan.

- [ ] **Step 5: Migrasi**

```bash
npm run db:generate
npm run db:migrate
```

- [ ] **Step 6: Tes integrasi**

Create `tests/integration/tour-request.test.ts` — menyimpan permintaan yang sah; menolak slug paket yang tidak ada; menolak `pax` nol dan negatif; menolak tanggal selesai sebelum tanggal mulai; membuat catatan pelanggan; menyalin nama paket ke `tourNameSnapshot`. Bersihkan permintaan **dan** pelanggan yang lahir darinya di `afterAll`.

Run: `npx vitest run tests/integration/tour-request.test.ts`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: formulir permintaan tur tersimpan dan tersambung WhatsApp"
```

---

### Task 6: Permintaan tur di panel admin

**Files:**
- Create: `src/app/admin/permintaan-tur/page.tsx`, `src/app/admin/permintaan-tur/[id]/page.tsx`, `src/actions/admin-tour-requests.ts`
- Modify: `src/components/admin/AdminNav.tsx`

- [ ] **Step 1: Kueri dan action**

Create `src/queries/tour-requests.ts` (`getTourRequests(status?)`, `getTourRequestById`) dan `src/actions/admin-tour-requests.ts` (`updateTourRequestStatus`, `updateTourRequestNotes`, `deleteTourRequest`) — masing-masing memanggil `requireSession()` sendiri.

- [ ] **Step 2: Halaman**

Create kedua halaman, keduanya memanggil `requireAdminPage()` sebelum kueri apa pun.

- [ ] **Step 3: Menu**

Modify `src/components/admin/AdminNav.tsx` — sisipkan `{ href: '/permintaan-tur', label: 'Permintaan Tur', Icon: Map }` setelah Booking, dan tambahkan impor ikon `Map`.

- [ ] **Step 4: Verifikasi**

Run: `npx tsc --noEmit && npm run build`
Expected: build sukses

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: permintaan tur di panel admin"
```

---

### Task 7: Verifikasi dan penerbitan

- [ ] **Step 1: Tes tanpa database tiga kali**

Run: `for i in 1 2 3; do npx vitest run tests/unit tests/properties tests/components 2>&1 | grep -E "^ *Tests +[0-9]"; done`
Expected: tiga baris identik.

- [ ] **Step 2: Tes integrasi**

Run: `npx vitest run tests/integration`
Expected: seluruhnya lulus.

- [ ] **Step 3: Pastikan tidak ada harga yang lolos ke halaman**

```bash
npm run build
grep -rlE "Rp ?[0-9]" .next/server/app/*/tours* 2>/dev/null || echo "tidak ada harga di halaman tours"
```

Expected: `tidak ada harga di halaman tours`

- [ ] **Step 4: Perbarui README**

Modify `README.md` — pada Struktur, ganti keterangan menu menjadi Beranda, Kendaraan, Tours, Testimoni, Tentang, Kontak; Ticketing dan Terms menyusul. Tambahkan ke daftar keputusan:

```markdown
**Paket tours adalah data statis di `src/data/tours/`, bukan isi database.** Tidak ada CRUD untuk
paket: mengubahnya berarti menyunting berkas dan menerbitkan ulang. Karena itu kedua halamannya
dibuat penuh saat build. Yang tersimpan di database hanya permintaan tur yang masuk — itu pesanan,
bukan konten.

**Paket tours tidak menampilkan harga sama sekali**, dan tipenya memang tidak punya kolom harga.
Seluruh paket mengarah ke WhatsApp untuk penawaran. Ada tes yang menahan kolom harga agar tidak
diam-diam masuk kembali.

**Foto tours ditaruh di `public/tours/<slug>/`** lalu nama berkasnya didaftarkan pada `images` di
berkas paketnya. Halaman tetap rapi selama daftar itu kosong.
```

- [ ] **Step 5: Commit dan dorong**

```bash
git add -A
git commit -m "docs: README mencakup paket tours statis"
git push origin main
```

- [ ] **Step 6: Verifikasi produksi**

```bash
for l in "" "/en" "/zh" "/ko"; do
  printf "%-6s %s\n" "${l:-/id}" "$(curl -s -o /dev/null -w '%{http_code}' --max-time 30 https://lians.id$l/tours)"
done
```

Lalu periksa satu halaman detail di tiap bahasa, dan pastikan tidak ada "Rp" pada keluarannya.
