import type { Metadata } from 'next';
import Link from 'next/link';
import { getFeaturedVehicles } from '@/queries/vehicles';
import { getFeaturedTestimonials } from '@/queries/testimonials';
import { getSettings } from '@/queries/settings';
import { getPublishedGallery } from '@/queries/gallery';
import { getPublishedPosts } from '@/queries/posts';
import { ambilUlasanGoogle } from '@/lib/google-reviews';
import { Hero } from '@/components/home/Hero';
import { ServiceCards } from '@/components/home/ServiceCards';
import { OurClients } from '@/components/home/OurClients';
import { HomeGallery } from '@/components/home/HomeGallery';
import { HomeBlog } from '@/components/home/HomeBlog';
import { GoogleReviews } from '@/components/home/GoogleReviews';
import { Reveal } from '@/components/ui/Reveal';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import { buildAutoRentalJsonLd, buildAlternates, SITE_URL } from '@/lib/seo';
import { formatRupiah } from '@/lib/format';
import { tarifTerendah } from '@/lib/vehicle-rate';
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

  const [kendaraan, testimoni, settings, galeri, artikel, ulasanGoogle] = await Promise.all([
    getFeaturedVehicles(6),
    getFeaturedTestimonials(3),
    getSettings(),
    getPublishedGallery(),
    getPublishedPosts(),
    ambilUlasanGoogle(),
  ]);

  const tarif = kendaraan
    .map((v) => tarifTerendah(v))
    .filter((n): n is number => n !== null);
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
        galeri={galeri}
      />

      {promo ? (
        <p className="bg-lians-600 px-4 py-3 text-center text-sm font-semibold text-white">
          {promo}
        </p>
      ) : null}

      <Reveal>
        <ServiceCards locale={locale} />
      </Reveal>

      <Reveal>
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
      </Reveal>

      {/* Urutan beranda mengikuti pertanyaan yang muncul berurutan di kepala
          pengunjung: apa yang ditawarkan, mobilnya seperti apa, wujud nyatanya
          bagaimana, siapa yang sudah memakai, apa kata mereka, dan apa yang
          perlu saya tahu sebelum memesan. */}
      <Reveal>
        <HomeGallery items={galeri} locale={locale} />
      </Reveal>

      <Reveal>
        <OurClients locale={locale} />
      </Reveal>

      <Reveal>
        <GoogleReviews data={ulasanGoogle} locale={locale} />
      </Reveal>

      {testimoni.length > 0 ? (
        <Reveal>
          <section className="bg-white py-16">
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
        </Reveal>
      ) : null}

      <Reveal>
        <HomeBlog posts={artikel} locale={locale} />
      </Reveal>
    </>
  );
}
