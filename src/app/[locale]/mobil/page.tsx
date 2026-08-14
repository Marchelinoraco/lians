import type { Metadata } from 'next';
import { getPublishedVehicles } from '@/queries/vehicles';
import { filterAndSortVehicles, parseCatalogFilters } from '@/lib/vehicle-filter';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import { CatalogControls } from '@/components/vehicle/CatalogControls';
import { buildAlternates } from '@/lib/seo';
import { getMessages, fill, type Locale } from '@/i18n';

export const revalidate = 300;

/**
 * Judul dan deskripsi ditulis per bahasa sebagai konstanta, bukan diambil dari
 * kamus: keduanya kalimat pemasaran yang wajar berbeda susunannya di tiap
 * bahasa, bukan label antarmuka yang tinggal disalin.
 */
const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Daftar Kendaraan Rental — LIANS Manado',
    description:
      'Pilihan armada rental mobil LIANS di Manado: hatchback, MPV, SUV, mobil mewah, dan Hiace pariwisata. Tarif harian lepas kunci maupun dengan pengemudi.',
  },
  en: {
    title: 'Rental Fleet — LIANS Manado',
    description:
      'LIANS car rental fleet in Manado: hatchbacks, MPVs, SUVs, luxury cars, and Hiace tour vans. Daily rates, self-drive or with a driver.',
  },
  zh: {
    title: '租车车型一览 — 万鸦老 LIANS',
    description:
      'LIANS 万鸦老租车车队：两厢车、MPV、SUV、豪华轿车与 Hiace 旅游车。按天计费，可自驾或含司机。',
  },
  ko: {
    title: '렌터카 차량 목록 — 마나도 LIANS',
    description:
      'LIANS 마나도 렌터카 차량: 해치백, MPV, SUV, 고급 차량, 하이에스 관광차. 자차 운전 또는 기사 포함, 일 단위 요금.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  // alternates sempat terlewat di halaman ini saja. Tanpa itu, Google tidak
  // punya sinyal bahwa katalog ini punya versi bahasa lain — dan sejak pemilih
  // bahasa berbentuk daftar yang dibuka, tag inilah satu-satunya sinyal yang
  // tersisa, karena tautannya tidak lagi ada di HTML awal.
  return { ...META[locale], alternates: buildAlternates('/mobil', locale) };
}

export default async function MobilPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ locale }, sp] = await Promise.all([params, searchParams]);
  const t = getMessages(locale);
  const filters = parseCatalogFilters(sp);
  const semua = await getPublishedVehicles();
  const hasil = filterAndSortVehicles(semua, filters);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.catalog.title}</h1>
        <p className="max-w-2xl text-muted">{t.catalog.subtitle}</p>
      </header>

      <CatalogControls filters={filters} locale={locale} />

      <p className="text-sm text-muted">
        {fill(t.catalog.showing, { n: hasil.length, total: semua.length })}
      </p>

      <VehicleGrid vehicles={hasil} locale={locale} />
    </div>
  );
}
