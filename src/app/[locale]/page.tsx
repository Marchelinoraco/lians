import { getFeaturedVehicles } from '@/queries/vehicles';
import { getSettings } from '@/queries/settings';
import { formatRupiah } from '@/lib/format';
import { getMessages, pickLocale, type Locale } from '@/i18n';

export const revalidate = 300;

/**
 * Beranda sementara. Diganti utuh pada Task 13 (hero, kartu layanan, armada
 * pilihan, rute, testimoni). Untuk sekarang cukup membuktikan bahwa routing
 * bahasa, kamus, dan pembacaan database sudah menyatu.
 */
export default async function BerandaPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const [kendaraan, settings] = await Promise.all([getFeaturedVehicles(6), getSettings()]);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-16">
      <header className="space-y-3">
        <h1 className="text-4xl font-black sm:text-5xl">
          {pickLocale(settings.heroTitle, locale)}
        </h1>
        <p className="max-w-xl text-muted">{pickLocale(settings.heroSubtitle, locale)}</p>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-black">{t.home.featuredFleet}</h2>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kendaraan.map((v) => (
            <li key={v.id} className="rounded-2xl border border-slate-200 p-5">
              <p className="font-bold">{v.name}</p>
              <p className="mt-1 text-lg font-black text-lians-600">
                {formatRupiah(v.rate24h)}{' '}
                <span className="text-xs font-medium text-muted">{t.common.perDay24}</span>
              </p>
              <ul className="mt-3 space-y-1 text-xs text-muted">
                {(pickLocale(v.features, locale) ?? []).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
