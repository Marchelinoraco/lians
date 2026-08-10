import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturedVehicles } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getFeaturedTestimonials } from '@/queries/testimonials';
import { getSettings } from '@/queries/settings';
import { Hero } from '@/components/home/Hero';
import { ServiceCards } from '@/components/home/ServiceCards';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { RouteCard } from '@/components/travel/RouteCard';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import { buildAutoRentalJsonLd, buildAlternates, SITE_URL } from '@/lib/seo';
import { formatRupiah } from '@/lib/format';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSettings();

  return {
    title: pickLocale(settings.heroTitle, locale) ?? 'LIANS',
    description: pickLocale(settings.heroSubtitle, locale) ?? '',
    alternates: buildAlternates('/', locale),
  };
}

export default async function BerandaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);

  const [kendaraan, rute, testimoni, settings] = await Promise.all([
    getFeaturedVehicles(6),
    getPublishedRoutes(),
    getFeaturedTestimonials(3),
    getSettings(),
  ]);

  const tarif = kendaraan.map((v) => v.rate24h);
  const priceRange =
    tarif.length > 0
      ? `${formatRupiah(Math.min(...tarif))} - ${formatRupiah(Math.max(...tarif))}`
      : '-';

  const jsonLd = buildAutoRentalJsonLd({
    settings,
    priceRange,
    url: `${SITE_URL}${localeHref('/', locale)}`,
    locale,
  });

  const promo = pickLocale(settings.promoBanner, locale);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Hero
        title={pickLocale(settings.heroTitle, locale) ?? ''}
        subtitle={pickLocale(settings.heroSubtitle, locale) ?? ''}
        locale={locale}
      />

      {promo ? (
        <p className="bg-lians-600 px-4 py-3 text-center text-sm font-semibold text-white">
          {promo}
        </p>
      ) : null}

      <ServiceCards locale={locale} />

      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-black sm:text-3xl">{t.home.featuredFleet}</h2>
          <Link
            href={localeHref('/mobil', locale)}
            className="shrink-0 text-sm font-semibold text-lians-600"
          >
            {t.common.viewAll} →
          </Link>
        </div>
        <VehicleGrid vehicles={kendaraan} locale={locale} />
      </section>

      {rute.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-black sm:text-3xl">{t.home.popularRoutes}</h2>
            <Link
              href={localeHref('/travel', locale)}
              className="shrink-0 text-sm font-semibold text-lians-600"
            >
              {t.common.viewAll} →
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {rute.slice(0, 3).map((r) => (
              <RouteCard
                key={r.id}
                route={r}
                whatsappNumber={settings.whatsappNumber}
                locale={locale}
              />
            ))}
          </div>
        </section>
      ) : null}

      {testimoni.length > 0 ? (
        <section className="bg-slate-50 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="mb-8 text-center text-2xl font-black sm:text-3xl">
              {t.home.whatCustomersSay}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {testimoni.map((item) => (
                <TestimonialCard key={item.id} testimonial={item} locale={locale} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
