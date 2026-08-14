import Image from 'next/image';
import Link from 'next/link';
import type { GalleryItem } from '@/db/schema';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

/**
 * Enam foto dalam kisi 4×2, dengan foto pertama dan terakhir selebar dua kolom.
 *
 * Pola ini dipilih karena habis dibagi: 4 kolom × 2 baris = 8 sel, dan dua foto
 * lebar memakan 4 sel, sisanya empat foto satu sel. Tidak ada yang tersisa
 * menggantung sendirian di baris berikutnya.
 *
 * Susunan sebelumnya — satu foto 2×2 — justru hanya pas untuk lima foto, dan
 * foto keenam terlempar ke baris ketiga sendirian.
 */
export function HomeGallery({ items, locale }: { items: GalleryItem[]; locale: Locale }) {
  const t = getMessages(locale);
  const enam = items.slice(0, 6);
  if (enam.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-black sm:text-3xl">{t.homeSections.galleryTitle}</h2>
          <p className="max-w-xl text-muted">{t.homeSections.gallerySubtitle}</p>
        </div>
        <Link
          href={localeHref('/testimoni', locale)}
          className="shrink-0 text-sm font-semibold text-lians-600"
        >
          {t.common.viewAll} →
        </Link>
      </div>

      <ul className="grid auto-rows-[180px] grid-cols-2 gap-3 sm:auto-rows-[200px] lg:grid-cols-4">
        {enam.map((item, i) => {
          const foto = item.image[0];
          if (!foto) return null;

          const keterangan = pickLocale(item.caption, locale) ?? '';
          // Foto pertama dan terakhir selebar dua kolom; sisanya satu kolom.
          const lebar = i === 0 || i === enam.length - 1;

          return (
            <li
              key={item.id}
              className={`group relative overflow-hidden rounded-2xl bg-slate-100 ${
                lebar ? 'col-span-2' : ''
              }`}
            >
              <Image
                src={foto.url}
                alt={keterangan || foto.alt || ''}
                fill
                sizes={lebar ? '(max-width: 1024px) 100vw, 50vw' : '(max-width: 1024px) 50vw, 25vw'}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {keterangan ? (
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 pt-8">
                  <p className={`font-medium text-white ${lebar ? 'text-sm' : 'text-xs'}`}>
                    {keterangan}
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
