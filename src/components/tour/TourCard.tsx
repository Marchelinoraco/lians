import Link from 'next/link';
import Image from 'next/image';
import { Clock, MapPin } from 'lucide-react';
import type { TourPackage } from '@/data/tours';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

const LABEL_KATEGORI: Record<TourPackage['category'], keyof ReturnType<typeof getMessages>['tours']> =
  {
    'open-trip': 'openTrip',
    'one-day': 'oneDay',
    'multi-day': 'multiDay',
  };

export function TourCard({ tour, locale }: { tour: TourPackage; locale: Locale }) {
  const t = getMessages(locale);

  const nama = pickLocale(tour.name, locale) ?? tour.name.id;
  const tagline = pickLocale(tour.tagline, locale) ?? '';
  const durasi = pickLocale(tour.duration, locale) ?? '';
  const destinasi = pickLocale(tour.destinations, locale) ?? [];
  const sampul = tour.images[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-gradient-to-br from-lians-50 via-sky-50 to-slate-100">
        {sampul ? (
          <Image
            src={`/tours/${tour.slug}/${sampul}`}
            alt={nama}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted">
            {t.tours.photoComingSoon}
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-lians-700">
          {t.tours[LABEL_KATEGORI[tour.category]]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <h2 className="text-lg font-bold leading-snug">
          <Link href={localeHref(`/tours/${tour.slug}`, locale)} className="after:absolute after:inset-0">
            {nama}
          </Link>
        </h2>

        <p className="text-sm text-muted">{tagline}</p>

        <dl className="mt-auto space-y-1.5 text-sm">
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
            <dd>{durasi}</dd>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
            <dd className="text-muted">{destinasi.slice(0, 4).join(' · ')}</dd>
          </div>
        </dl>

        <p className="text-sm font-semibold text-lians-600">{t.tours.viewPackage} →</p>
      </div>
    </article>
  );
}
