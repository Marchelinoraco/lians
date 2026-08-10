import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function Hero({
  title,
  subtitle,
  locale,
}: {
  title: string;
  subtitle: string;
  locale: Locale;
}) {
  const t = getMessages(locale);

  return (
    <section className="border-b border-slate-200 bg-gradient-to-b from-lians-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
        <p className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-lians-700 shadow-sm">
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {t.home.servingArea}
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">{subtitle}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href={localeHref('/mobil', locale)}
            className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600"
          >
            {t.home.viewFleet}
          </Link>
          <Link
            href={localeHref('/booking', locale)}
            className="rounded-lg border border-slate-300 bg-white px-6 py-3 font-semibold hover:border-lians-400"
          >
            {t.common.bookNow}
          </Link>
        </div>
      </div>
    </section>
  );
}
