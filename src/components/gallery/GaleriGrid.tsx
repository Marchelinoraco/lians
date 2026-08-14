import Image from 'next/image';
import type { GalleryItem } from '@/db/schema';
import { pickLocale, type Locale } from '@/i18n';

export function GaleriGrid({ items, locale }: { items: GalleryItem[]; locale: Locale }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const foto = item.image[0];
        if (!foto) return null;

        const keterangan = pickLocale(item.caption, locale) ?? '';

        return (
          <li key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="relative aspect-[4/3] bg-slate-100">
              <Image
                src={foto.url}
                alt={keterangan || foto.alt || ''}
                fill
                sizes="(max-width: 640px) 100vw, 33vw"
                className="object-cover"
              />
            </div>
            {keterangan ? <p className="p-4 text-sm text-muted">{keterangan}</p> : null}
          </li>
        );
      })}
    </ul>
  );
}
