// Env dimuat lewat `tsx --env-file=.env.local` di package.json, bukan di sini:
// impor ES di-hoist ke atas panggilan apa pun, sehingga memanggil dotenv di
// berkas ini terlambat — src/db/index.ts sudah dievaluasi lebih dulu.
import bcrypt from 'bcryptjs';
import { db } from '@/db';
import { siteSettings, testimonials, travelRoutes, users, vehicles } from '@/db/schema';
import { DEFAULT_SETTINGS } from '@/queries/settings';
import { slugify } from '@/lib/slug';

const armada = [
  { name: 'All New Brio', category: 'hatchback' as const, rateLepasKunci: 350000, ratePelayanan: null, seats: 5, transmission: 'automatic' as const, year: 2024 },
  { name: 'Toyota Avanza', category: 'mpv' as const, rateLepasKunci: 400000, ratePelayanan: null, seats: 7, transmission: 'manual' as const, year: 2023 },
  { name: 'Toyota Rush', category: 'suv' as const, rateLepasKunci: 500000, ratePelayanan: null, seats: 7, transmission: 'automatic' as const, year: 2023 },
  { name: 'Innova Reborn', category: 'mpv' as const, rateLepasKunci: 700000, ratePelayanan: null, seats: 7, transmission: 'automatic' as const, year: 2022 },
  { name: 'Innova Zenix G', category: 'mpv' as const, rateLepasKunci: 900000, ratePelayanan: null, seats: 7, transmission: 'automatic' as const, year: 2024 },
  { name: 'Toyota Fortuner', category: 'suv' as const, rateLepasKunci: 1200000, ratePelayanan: null, seats: 7, transmission: 'automatic' as const, year: 2023 },
  { name: 'Toyota Alphard', category: 'luxury' as const, rateLepasKunci: 2500000, ratePelayanan: null, seats: 7, transmission: 'automatic' as const, year: 2022 },
  { name: 'Hiace Commuter', category: 'bus' as const, rateLepasKunci: 1300000, ratePelayanan: null, seats: 15, transmission: 'manual' as const, year: 2023 },
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
      serviceTypes:
        m.category === 'bus' ? ['with-driver', 'tourism'] : ['self-drive', 'with-driver'],
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
      vehicleName: 'Innova Reborn',
      date: '2026-06-12',
      isFeatured: true,
      isPublished: true,
      sortOrder: 0,
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
      vehicleName: 'Toyota Avanza',
      date: '2026-07-02',
      isFeatured: true,
      isPublished: true,
      sortOrder: 1,
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
      vehicleName: 'Hiace Commuter',
      date: '2026-07-20',
      isFeatured: true,
      isPublished: true,
      sortOrder: 2,
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
