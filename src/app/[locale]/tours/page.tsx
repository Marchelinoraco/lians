import type { Metadata } from 'next';
import { TOUR_PACKAGES } from '@/data/tours';
import { TourCard } from '@/components/tour/TourCard';
import { buildAlternates } from '@/lib/seo';
import { getMessages, fill, LOCALES, type Locale } from '@/i18n';

/**
 * Paket adalah data statis di dalam repo, jadi halaman ini dibuat penuh saat
 * build. Tidak ada `revalidate`: tidak ada yang bisa berubah tanpa penerbitan
 * ulang.
 */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Paket Wisata Manado — LIANS',
    description:
      'Paket wisata Manado dan Minahasa: Bunaken, Nain, Siladen, Lihaga, Likupang, dan dataran tinggi Minahasa. Dari sehari sampai lima hari, dengan pemandu dan dokumentasi foto.',
  },
  en: {
    title: 'Manado Tour Packages — LIANS',
    description:
      'Tours around Manado and Minahasa: Bunaken, Nain, Siladen, Lihaga, Likupang, and the Minahasa highlands. From one day to five, with a guide and photo documentation.',
  },
  zh: {
    title: '万鸦老旅游套餐 — LIANS',
    description:
      '万鸦老与米纳哈萨旅游套餐：布纳肯、纳因、西拉登、利哈加、利库邦及米纳哈萨高原。行程从一日至五日，含导游与摄影记录。',
  },
  ko: {
    title: '마나도 투어 패키지 — LIANS',
    description:
      '마나도와 미나하사 투어: 부나켄, 나인, 실라덴, 리하가, 리쿠팡, 미나하사 고원. 당일부터 4박 5일까지, 가이드와 사진 촬영 포함.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/tours', locale) };
}

export default async function ToursPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.tours.title}</h1>
        <p className="max-w-2xl text-muted">{t.tours.subtitle}</p>
      </header>

      <p className="text-sm text-muted">
        {fill(t.tours.showing, { n: TOUR_PACKAGES.length, total: TOUR_PACKAGES.length })}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {TOUR_PACKAGES.map((tour) => (
          <TourCard key={tour.slug} tour={tour} locale={locale} />
        ))}
      </div>
    </div>
  );
}
