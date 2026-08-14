import type { MetadataRoute } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { getPublishedPosts } from '@/queries/posts';
import { TOUR_PACKAGES } from '@/data/tours';
import { SITE_URL, buildAlternates } from '@/lib/seo';
import { LOCALES, localeHref } from '@/i18n';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [kendaraan, artikel] = await Promise.all([getPublishedVehicles(), getPublishedPosts()]);

  const halaman: { path: string; lastModified: Date; priority: number }[] = [
    // /booking dan /tiket tidak diindeks: keduanya halaman aksi, bukan halaman
    // tujuan pencarian. /tiket tetap dimasukkan karena juga menjelaskan layanan
    // dan maskapai yang dilayani — orang mencari itu.
    ...[
      '/',
      '/mobil',
      '/tours',
      '/tiket',
      '/blog',
      '/testimoni',
      '/syarat-ketentuan',
      '/tentang',
      '/kontak',
    ].map((path) => ({
      path,
      lastModified: new Date(),
      priority: path === '/' ? 1 : 0.8,
    })),

    ...kendaraan.map((v) => ({
      path: `/mobil/${v.slug}`,
      lastModified: v.updatedAt,
      priority: 0.7,
    })),

    // Paket tur statis di repo, jadi tanggal ubahnya tidak tercatat di mana pun;
    // dipakai tanggal build, yang memang berubah tiap kali isinya disunting.
    ...TOUR_PACKAGES.map((t) => ({
      path: `/tours/${t.slug}`,
      lastModified: new Date(),
      priority: 0.7,
    })),

    ...artikel.map((p) => ({
      path: `/blog/${p.slug}`,
      lastModified: p.updatedAt,
      priority: 0.6,
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
