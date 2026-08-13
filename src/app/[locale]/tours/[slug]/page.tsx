import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, XCircle, Clock, MapPin, Info, Sparkles } from 'lucide-react';
import { TOUR_PACKAGES, getTourBySlug } from '@/data/tours';
import { TourGallery } from '@/components/tour/TourGallery';
import { TourItinerary } from '@/components/tour/TourItinerary';
import { TourCard } from '@/components/tour/TourCard';
import { TourRequestForm } from '@/components/tour/TourRequestForm';
import { getSettings } from '@/queries/settings';
import { buildAlternates } from '@/lib/seo';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, localeHref, LOCALES, type Locale } from '@/i18n';

/** Seluruh kombinasi bahasa × paket dibuat saat build — datanya statis. */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) => TOUR_PACKAGES.map((t) => ({ locale, slug: t.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) return { title: 'LIANS' };

  const nama = pickLocale(tour.name, locale) ?? tour.name.id;
  const tagline = pickLocale(tour.tagline, locale) ?? '';
  const intro = pickLocale(tour.intro, locale) ?? [];

  return {
    title: `${nama} — LIANS Manado`,
    // Paragraf pertama dipotong, bukan tagline: mesin pencari menampilkan
    // kalimat ini di hasil, dan kalimat isi lebih memberi tahu daripada slogan.
    description: (intro[0] ?? tagline).slice(0, 300),
    alternates: buildAlternates(`/tours/${tour.slug}`, locale),
    openGraph: { title: nama, description: tagline },
  };
}

export default async function DetailTourPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const tour = getTourBySlug(slug);
  if (!tour) notFound();

  const t = getMessages(locale);
  const settings = await getSettings();

  const nama = pickLocale(tour.name, locale) ?? tour.name.id;
  const tagline = pickLocale(tour.tagline, locale) ?? '';
  const durasi = pickLocale(tour.duration, locale) ?? '';
  const destinasi = pickLocale(tour.destinations, locale) ?? [];
  const intro = pickLocale(tour.intro, locale) ?? [];
  const sorotan = pickLocale(tour.highlights, locale) ?? [];
  const termasuk = pickLocale(tour.includes, locale) ?? [];
  const belumTermasuk = pickLocale(tour.excludes, locale) ?? [];
  const titikKumpul = tour.meetingPoint ? pickLocale(tour.meetingPoint, locale) : null;
  const catatan = tour.notes ? (pickLocale(tour.notes, locale) ?? []) : [];

  const lainnya = TOUR_PACKAGES.filter((p) => p.slug !== tour.slug).slice(0, 3);

  // Pesan WhatsApp selalu berbahasa Indonesia — yang membacanya staf di Manado.
  const pesanWa = `Halo LIANS, saya ingin bertanya tentang paket "${tour.name.id}".`;

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-12">
      <nav className="text-sm text-muted">
        <Link href={localeHref('/tours', locale)} className="hover:text-lians-600">
          ← {t.tours.title}
        </Link>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
        <div className="space-y-10">
          <header className="space-y-3">
            <h1 className="text-3xl font-black leading-tight sm:text-4xl">{nama}</h1>
            <p className="text-lg text-muted">{tagline}</p>

            <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-lians-500" aria-hidden />
                <dt className="sr-only">{t.tours.durationLabel}</dt>
                <dd className="font-semibold">{durasi}</dd>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
                <dt className="sr-only">{t.tours.destinationsLabel}</dt>
                <dd className="text-muted">{destinasi.join(' · ')}</dd>
              </div>
            </dl>
          </header>

          <TourGallery
            slug={tour.slug}
            images={tour.images}
            alt={nama}
            emptyLabel={t.tours.photoComingSoon}
          />

          <section className="space-y-4">
            {intro.map((paragraf, i) => (
              <p key={i} className="leading-relaxed">
                {paragraf}
              </p>
            ))}
          </section>

          {sorotan.length > 0 ? (
            <section className="rounded-2xl border border-lians-200 bg-lians-50/60 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-bold">
                <Sparkles className="h-5 w-5 text-lians-500" aria-hidden />
                {t.tours.highlightsLabel}
              </h2>
              <ul className="space-y-2">
                {sorotan.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="mb-6 text-xl font-bold">{t.tours.itineraryLabel}</h2>
            <TourItinerary days={tour.itinerary} locale={locale} />
          </section>

          <div className="grid gap-6 sm:grid-cols-2">
            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 font-bold">{t.tours.includesLabel}</h2>
              <ul className="space-y-2">
                {termasuk.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"
                      aria-hidden
                    />
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6">
              <h2 className="mb-4 font-bold">{t.tours.excludesLabel}</h2>
              <ul className="space-y-2">
                {belumTermasuk.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {catatan.length > 0 ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-amber-900">
                <Info className="h-5 w-5" aria-hidden />
                {t.tours.notesLabel}
              </h2>
              <ul className="space-y-2">
                {catatan.map((s, i) => (
                  <li key={i} className="text-sm leading-relaxed text-amber-900">
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="font-bold">{t.tours.requestTitle}</h2>
            <p className="mt-1 text-sm text-muted">{t.tours.requestSubtitle}</p>

            {titikKumpul ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  {t.tours.meetingPointLabel}
                </p>
                <p className="mt-1 text-sm">{titikKumpul}</p>
              </div>
            ) : null}

            <div className="mt-5">
              <TourRequestForm tourSlug={tour.slug} locale={locale} />
            </div>

            {/* Jalur kedua untuk yang enggan mengisi formulir. Sebagian orang
                memang lebih suka langsung mengetik sendiri di WhatsApp. */}
            <a
              href={waLink(settings.whatsappNumber, pesanWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block rounded-lg border border-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              {t.tours.askPrice}
            </a>
          </div>
        </aside>
      </div>

      {lainnya.length > 0 ? (
        <section className="space-y-6 border-t border-slate-200 pt-10">
          <h2 className="text-xl font-bold">{t.tours.otherPackages}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {lainnya.map((p) => (
              <TourCard key={p.slug} tour={p} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
