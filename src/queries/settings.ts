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
