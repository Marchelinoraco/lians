import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Users, Cog, Fuel, Briefcase, Calendar } from 'lucide-react';
import { getPublishedVehicles, getVehicleBySlug } from '@/queries/vehicles';
import { getSettings } from '@/queries/settings';
import { formatRupiah } from '@/lib/format';
import { VehicleGallery } from '@/components/vehicle/VehicleGallery';
import { buildVehicleJsonLd, buildAlternates, SITE_URL } from '@/lib/seo';
import { tarifTerendah } from '@/lib/vehicle-rate';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, localeHref, LOCALES, type Locale } from '@/i18n';

export const revalidate = 300;

export async function generateStaticParams() {
  const semua = await getPublishedVehicles();
  return LOCALES.flatMap((locale) => semua.map((v) => ({ locale, slug: v.slug })));
}

/** Nama kendaraan tidak diterjemahkan — itu nama diri. */
const JUDUL: Record<Locale, (nama: string, harga: string) => string> = {
  id: (nama, harga) => `Sewa ${nama} di Manado — mulai ${harga}/hari`,
  en: (nama, harga) => `Rent ${nama} in Manado — from ${harga}/day`,
  zh: (nama, harga) => `万鸦老租 ${nama} — ${harga} 起/天`,
  ko: (nama, harga) => `마나도 ${nama} 렌트 — ${harga}/일부터`,
};

const DESKRIPSI: Record<Locale, (v: { name: string; year: number; seats: number }) => string> = {
  id: (v) =>
    `Rental ${v.name} tahun ${v.year}, ${v.seats} kursi. Lepas kunci atau dengan sopir di Manado. Hubungi LIANS.`,
  en: (v) =>
    `Rent a ${v.year} ${v.name}, ${v.seats} seats. Self-drive or with driver in Manado. Contact LIANS.`,
  zh: (v) => `${v.year} 年 ${v.name}，${v.seats} 座。万鸦老自驾或含司机租车，请联系 LIANS。`,
  ko: (v) =>
    `${v.year}년식 ${v.name}, ${v.seats}인승. 마나도 자차 운전 또는 기사 포함 렌트. LIANS로 문의하세요.`,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const v = await getVehicleBySlug(slug);
  if (!v) return { title: 'LIANS' };

  const judul = JUDUL[locale](v.name, formatRupiah(tarifTerendah(v) ?? 0));
  return {
    title: judul,
    description: DESKRIPSI[locale](v),
    alternates: buildAlternates(`/mobil/${v.slug}`, locale),
    openGraph: { title: judul, images: v.images[0] ? [v.images[0].url] : [] },
  };
}

export default async function DetailMobilPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const [vehicle, settings] = await Promise.all([getVehicleBySlug(slug), getSettings()]);

  if (!vehicle || !vehicle.isPublished) notFound();

  const t = getMessages(locale);
  const tersedia = vehicle.status === 'available';
  const fitur = pickLocale(vehicle.features, locale) ?? [];
  const syarat = pickLocale(vehicle.rentalTerms, locale) ?? [];
  const jsonLd = buildVehicleJsonLd({
    vehicle,
    url: `${SITE_URL}${localeHref(`/mobil/${vehicle.slug}`, locale)}`,
  });
  const pesanWa = `Halo LIANS, saya ingin menanyakan ketersediaan ${vehicle.name}.`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="breadcrumb" className="mb-6 text-sm text-muted">
        <Link href={localeHref('/mobil', locale)} className="hover:text-lians-600">
          {t.nav.vehicles}
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page">{vehicle.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <VehicleGallery
          images={vehicle.images}
          alt={vehicle.name}
          emptyLabel={t.common.photoComingSoon}
        />

        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-black sm:text-4xl">{vehicle.name}</h1>
            {!tersedia ? (
              <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                {t.vehicle.unavailableNote}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {vehicle.rateLepasKunci !== null ? (
              <div className="rounded-xl border border-lians-200 bg-lians-50 p-4">
                <p className="text-xs font-semibold text-lians-700">{t.common.lepasKunci}</p>
                <p className="text-2xl font-black text-lians-700">
                  {formatRupiah(vehicle.rateLepasKunci)}
                </p>
                <p className="text-xs text-muted">
                  {t.common.perHari} · {t.common.lepasKunciNote}
                </p>
              </div>
            ) : null}

            {vehicle.ratePelayanan !== null ? (
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-semibold text-slate-600">{t.common.pelayanan}</p>
                <p className="text-2xl font-black">{formatRupiah(vehicle.ratePelayanan)}</p>
                <p className="text-xs text-muted">
                  {t.common.perHari} · {t.common.pelayananNote}
                </p>
              </div>
            ) : null}
          </div>

          <dl className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200 p-4 text-sm sm:grid-cols-3">
            {[
              { Icon: Users, label: t.vehicle.capacity, value: `${vehicle.seats} ${t.common.seats}` },
              {
                Icon: Cog,
                label: t.vehicle.transmission,
                value: vehicle.transmission === 'automatic' ? t.common.automatic : t.common.manual,
              },
              { Icon: Fuel, label: t.vehicle.fuel, value: vehicle.fuelType },
              { Icon: Calendar, label: t.vehicle.year, value: String(vehicle.year) },
              {
                Icon: Briefcase,
                label: t.vehicle.luggageLabel,
                value: `${vehicle.luggage} ${t.common.luggage}`,
              },
            ].map(({ Icon, label, value }) => (
              <div key={label}>
                <dt className="flex items-center gap-1.5 text-xs text-muted">
                  <Icon className="h-3.5 w-3.5" aria-hidden /> {label}
                </dt>
                <dd className="font-semibold capitalize">{value}</dd>
              </div>
            ))}
          </dl>

          {fitur.length > 0 ? (
            <section>
              <h2 className="mb-2 font-bold">{t.vehicle.features}</h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {fitur.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-lians-500" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {syarat.length > 0 ? (
            <section>
              <h2 className="mb-2 font-bold">{t.vehicle.terms}</h2>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted">
                {syarat.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Link
              href={localeHref(`/booking?vehicle=${vehicle.slug}`, locale)}
              aria-disabled={!tersedia}
              className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              {t.common.bookNow}
            </Link>
            <a
              href={waLink(settings.whatsappNumber, pesanWa)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-slate-300 px-6 py-3 font-semibold hover:border-lians-400"
            >
              {t.common.askWhatsApp}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
