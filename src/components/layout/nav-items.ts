import type { Messages } from '@/i18n';

/**
 * `key` menunjuk ke kamus, bukan teks langsung — supaya label ikut berganti bahasa.
 *
 * Menu tumbuh bertahap: Ticketing, Tours, dan Terms menyusul bersama halamannya
 * di Tahap 2C dan 2D. Memasang tautan ke halaman yang belum ada berarti
 * menayangkan 404 di situs yang sedang dipakai pelanggan.
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
