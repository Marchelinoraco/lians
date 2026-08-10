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
