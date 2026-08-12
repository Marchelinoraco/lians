import type { Metadata } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { BookingForm } from '@/components/booking/BookingForm';
import { createBooking } from '@/actions/booking';
import { getMessages, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Booking Rental Mobil — LIANS Manado',
    description: 'Isi formulir pemesanan rental mobil LIANS. Konfirmasi cepat lewat WhatsApp.',
  },
  en: {
    title: 'Book a Car Rental — LIANS Manado',
    description: 'Fill in the LIANS booking form. Fast confirmation via WhatsApp.',
  },
  zh: {
    title: '在线预订租车 — 万鸦老 LIANS',
    description: '填写 LIANS 预订表单，我们将通过 WhatsApp 快速确认。',
  },
  ko: {
    title: '렌터카 예약 — 마나도 LIANS',
    description: 'LIANS 예약 양식을 작성하세요. WhatsApp으로 빠르게 확인해 드립니다.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/booking', locale) };
}

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ vehicle?: string; route?: string }>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = getMessages(locale);
  const [vehicles, routes, settings] = await Promise.all([
    getPublishedVehicles(),
    getPublishedRoutes(),
    getSettings(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.booking.title}</h1>
        <p className="max-w-2xl text-muted">{t.booking.subtitle}</p>
      </header>

      <BookingForm
        vehicles={vehicles.map((v) => ({
          id: v.id,
          slug: v.slug,
          name: v.name,
          rateLepasKunci: v.rateLepasKunci,
          ratePelayanan: v.ratePelayanan,
          status: v.status,
        }))}
        routes={routes.map((r) => ({
          id: r.id,
          label: `${r.origin} → ${r.destination}`,
          price: r.price,
        }))}
        defaultVehicleSlug={sp.vehicle ?? null}
        defaultRouteId={sp.route ?? null}
        onSubmit={createBooking}
        locale={locale}
      />
    </div>
  );
}
