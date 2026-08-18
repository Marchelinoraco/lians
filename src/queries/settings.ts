import { db } from '@/db';
import { siteSettings } from '@/db/schema';
import type { SettingsInput } from '@/schemas/settings';

export const DEFAULT_SETTINGS: SettingsInput = {
  whatsappNumber: '081234567890',
  phone: '081234567890',
  email: 'info@lians.id',
  address:
    'Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125',
  mapsUrl: '',
  socialLinks: [],

  // Lima kunci berikut dapat diterjemahkan; Indonesia wajib, sisanya opsional.
  operatingHours: {
    id: 'Setiap hari, 07.00 – 21.00 WITA',
    en: 'Daily, 7:00 AM – 9:00 PM (WITA)',
    zh: '每天 07:00 – 21:00（WITA）',
    ko: '매일 07:00 – 21:00 (WITA)',
  },
  heroTitle: {
    id: 'Jelajahi dan Nikmati Keindahan Sulawesi Utara Bersama Kami',
    en: 'Explore and Enjoy Wonderful North Sulawesi with Us',
    zh: '与我们一起探索北苏拉威西之美',
    ko: '북술라웨시의 아름다움을 저희와 함께 즐겨보세요',
  },
  heroSubtitle: {
    id:
      'Kami merupakan penyedia jasa rental mobil dan paket wisata di Manado yang telah berpengalaman. Untuk kenyamanan Anda, kami menyediakan berbagai kendaraan keluaran terbaru, driver dan tour guide berpengalaman yang siap menemani perjalanan Anda selama berada di Manado dan sekitarnya.',
    en:
      'An experienced car rental and tour operator in Manado. For your comfort we provide late-model vehicles, with seasoned drivers and tour guides ready to accompany you throughout Manado and the surrounding area.',
    zh:
      '我们是万鸦老经验丰富的租车与旅游套餐服务商。为让您舒心出行，我们提供多款新款车辆，以及经验丰富的司机和导游，全程陪伴您在万鸦老及周边的行程。',
    ko:
      '저희는 마나도에서 경험을 쌓아온 렌터카·투어 패키지 전문 업체입니다. 편안한 여행을 위해 최신 차량과 경험 많은 기사, 투어 가이드가 마나도와 인근 지역 일정 내내 함께합니다.',
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
