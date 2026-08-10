import type { Metadata } from 'next';
import { getSettings } from '@/queries/settings';
import { getMessages, fill, pickLocale, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Tentang LIANS — Rental Mobil Manado',
    description: 'Profil LIANS, penyedia rental mobil dan antar-jemput di Manado, Sulawesi Utara.',
  },
  en: {
    title: 'About LIANS — Car Rental in Manado',
    description:
      'About LIANS, a car rental and airport transfer provider in Manado, North Sulawesi.',
  },
  zh: {
    title: '关于 LIANS — 万鸦老租车',
    description: '关于 LIANS：北苏拉威西万鸦老的租车与机场接送服务商。',
  },
  ko: {
    title: 'LIANS 소개 — 마나도 렌터카',
    description: '북술라웨시 마나도의 렌터카 및 공항 픽업 업체 LIANS 소개.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/tentang', locale) };
}

export default async function TentangPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const settings = await getSettings();
  const teks = pickLocale(settings.aboutText, locale);

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-black sm:text-4xl">{t.about.title}</h1>

      {teks ? (
        teks.split('\n\n').map((paragraf, i) => (
          <p key={i} className="leading-relaxed text-slate-700">
            {paragraf}
          </p>
        ))
      ) : (
        <p className="leading-relaxed text-slate-700">
          {fill(t.about.fallback, { alamat: settings.address })}
        </p>
      )}
    </div>
  );
}
