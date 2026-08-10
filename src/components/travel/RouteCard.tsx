import Link from 'next/link';
import { ArrowRight, Clock, Car } from 'lucide-react';
import type { TravelRoute } from '@/db/schema';
import { formatRupiah } from '@/lib/format';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

export function RouteCard({
  route,
  whatsappNumber,
  locale,
}: {
  route: TravelRoute;
  whatsappNumber: string;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const durasi = pickLocale(route.estimatedDuration, locale);
  const catatan = pickLocale(route.vehicleNote, locale);

  // Pesan WhatsApp selalu berbahasa Indonesia — yang membacanya staf LIANS.
  const pesan = `Halo LIANS, saya ingin menanyakan harga antar-jemput ${route.origin} ke ${route.destination}.`;

  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 font-bold">
        <span>{route.origin}</span>
        <ArrowRight className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
        <span>{route.destination}</span>
      </div>

      {durasi || catatan ? (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          {durasi ? (
            <li className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" aria-hidden /> {durasi}
            </li>
          ) : null}
          {catatan ? (
            <li className="flex items-center gap-1">
              <Car className="h-3.5 w-3.5" aria-hidden /> {catatan}
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="mt-auto border-t border-slate-100 pt-4">
        {route.price !== null ? (
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="text-xl font-black text-lians-600">{formatRupiah(route.price)}</p>
              <p className="text-xs text-muted">{t.travel.oneWayIncludingDriver}</p>
            </div>
            <Link
              href={localeHref(`/booking?route=${route.id}`, locale)}
              className="rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
            >
              {t.common.order}
            </Link>
          </div>
        ) : (
          <a
            href={waLink(whatsappNumber, pesan)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg border border-lians-300 px-4 py-2 text-sm font-semibold text-lians-700 hover:bg-lians-50"
          >
            {t.common.contactForPrice}
          </a>
        )}
      </div>
    </article>
  );
}
