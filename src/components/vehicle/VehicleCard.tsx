import Link from 'next/link';
import Image from 'next/image';
import { Users, Cog, Fuel, Briefcase } from 'lucide-react';
import type { Vehicle } from '@/db/schema';
import { formatRupiah } from '@/lib/format';
import { getMessages, localeHref, type Locale } from '@/i18n';

const LABEL_KATEGORI: Record<string, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  mpv: 'MPV',
  luxury: 'Luxury',
  bus: 'Bus / Hiace',
};

export function VehicleCard({ vehicle, locale }: { vehicle: Vehicle; locale: Locale }) {
  const t = getMessages(locale);
  const gambar = vehicle.images[0];
  const tersedia = vehicle.status === 'available';

  return (
    <article className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[4/3] bg-slate-100">
        {gambar ? (
          <Image
            src={gambar.url}
            alt={gambar.alt || vehicle.name}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted">
            {t.common.photoComingSoon}
          </div>
        )}

        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-lians-700">
          {LABEL_KATEGORI[vehicle.category] ?? vehicle.category}
        </span>

        {!tersedia ? (
          <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
            {t.common.unavailable}
          </span>
        ) : null}
      </div>

      <div className="space-y-3 p-5">
        <h3 className="text-lg font-bold">
          <Link
            href={localeHref(`/mobil/${vehicle.slug}`, locale)}
            className="after:absolute after:inset-0"
          >
            {vehicle.name}
          </Link>
        </h3>

        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <li className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" aria-hidden /> {vehicle.seats} {t.common.seats}
          </li>
          <li className="flex items-center gap-1">
            <Cog className="h-3.5 w-3.5" aria-hidden />
            {vehicle.transmission === 'automatic' ? t.common.automatic : t.common.manual}
          </li>
          <li className="flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5" aria-hidden /> {vehicle.year}
          </li>
          <li className="flex items-center gap-1">
            <Briefcase className="h-3.5 w-3.5" aria-hidden /> {vehicle.luggage} {t.common.luggage}
          </li>
        </ul>

        <div className="space-y-1 border-t border-slate-100 pt-3">
          {vehicle.rateLepasKunci !== null ? (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted">{t.common.lepasKunci}</span>
              <span className="font-bold text-lians-600">
                {formatRupiah(vehicle.rateLepasKunci)}
                <span className="ml-1 text-xs font-medium text-muted">{t.common.perHari}</span>
              </span>
            </div>
          ) : null}

          {vehicle.ratePelayanan !== null ? (
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted">{t.common.pelayanan}</span>
              <span className="font-bold text-slate-700">
                {formatRupiah(vehicle.ratePelayanan)}
                <span className="ml-1 text-xs font-medium text-muted">{t.common.perHari}</span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
