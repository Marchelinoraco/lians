import type { Messages } from '@/i18n';

/**
 * `key` menunjuk ke kamus, bukan teks langsung — supaya label ikut berganti bahasa.
 *
 * Label di kamus sengaja pendek ("Syarat", bukan "Syarat & Ketentuan"): daftar
 * ini juga dipakai bilah atas, dan delapan menu berlabel panjang akan
 * berdesakan di layar lebar. Judul lengkapnya tetap ada di halamannya.
 *
 * Booking sengaja bukan menu — alurnya selalu dimulai dari memilih kendaraan.
 */
export const NAV_ITEMS = [
  { href: '/', key: 'home' },
  { href: '/mobil', key: 'vehicles' },
  { href: '/tours', key: 'tours' },
  { href: '/tiket', key: 'ticketing' },
  { href: '/blog', key: 'blog' },
  { href: '/syarat-ketentuan', key: 'terms' },
  { href: '/testimoni', key: 'testimonials' },
  { href: '/tentang', key: 'about' },
  { href: '/kontak', key: 'contact' },
] as const satisfies readonly { href: string; key: keyof Messages['nav'] }[];
