import type { Metadata } from 'next';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';
import { RouteCard } from '@/components/travel/RouteCard';
import { getMessages, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Antar-Jemput Bandara & Travel Manado — LIANS',
    description:
      'Layanan antar-jemput Bandara Sam Ratulangi dan travel antar kota di Sulawesi Utara. Tarif tetap sekali jalan, sudah termasuk sopir.',
  },
  en: {
    title: 'Manado Airport Transfer & Intercity Travel — LIANS',
    description:
      'Sam Ratulangi Airport transfers and intercity travel across North Sulawesi. Fixed one-way fares, driver included.',
  },
  zh: {
    title: '万鸦老机场接送与城际包车 — LIANS',
    description: '沙姆·拉图兰吉机场接送及北苏拉威西城际包车。单程固定价，含司机。',
  },
  ko: {
    title: '마나도 공항 픽업 및 시외 이동 — LIANS',
    description: '삼 라툴랑기 공항 픽업과 북술라웨시 시외 이동. 편도 고정 요금, 기사 포함.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/travel', locale) };
}

export default async function TravelPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const [rute, settings] = await Promise.all([getPublishedRoutes(), getSettings()]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.travel.title}</h1>
        <p className="max-w-2xl text-muted">{t.travel.subtitle}</p>
      </header>

      {rute.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          {t.travel.empty}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rute.map((r) => (
            <RouteCard
              key={r.id}
              route={r}
              whatsappNumber={settings.whatsappNumber}
              locale={locale}
            />
          ))}
        </div>
      )}
    </div>
  );
}
