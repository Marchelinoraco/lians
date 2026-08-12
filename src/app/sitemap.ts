import type { MetadataRoute } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { SITE_URL, buildAlternates } from '@/lib/seo';
import { LOCALES, localeHref } from '@/i18n';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const kendaraan = await getPublishedVehicles();

  const halaman: { path: string; lastModified: Date; priority: number }[] = [
    // /booking tidak diindeks: itu halaman aksi, bukan halaman tujuan pencarian.
    ...['/', '/mobil', '/testimoni', '/tentang', '/kontak'].map((path) => ({
      path,
      lastModified: new Date(),
      priority: path === '/' ? 1 : 0.8,
    })),
    ...kendaraan.map((v) => ({
      path: `/mobil/${v.slug}`,
      lastModified: v.updatedAt,
      priority: 0.7,
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
