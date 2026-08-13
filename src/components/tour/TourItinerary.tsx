import type { TourDay } from '@/data/tours';
import { pickLocale, type Locale } from '@/i18n';

/**
 * Sebagian paket menerbitkan jamnya, sebagian hanya urutannya. Kolom waktu
 * dibiarkan kosong untuk yang tanpa jam, bukan diisi perkiraan — dan lebarnya
 * tetap sama supaya daftarnya lurus meski hanya sebagian yang berjam.
 */
export function TourItinerary({ days, locale }: { days: TourDay[]; locale: Locale }) {
  return (
    <div className="space-y-8">
      {days.map((hari, iHari) => (
        <section key={iHari}>
          <h3 className="mb-4 font-bold text-lians-700">
            {pickLocale(hari.label, locale) ?? hari.label.id}
          </h3>

          <ol className="space-y-0">
            {hari.steps.map((step, iStep) => (
              <li key={iStep} className="flex gap-4">
                <div className="w-14 shrink-0 pt-0.5 text-right text-xs font-semibold tabular-nums text-lians-600">
                  {step.time ?? ''}
                </div>

                <div className="relative flex flex-col items-center">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-lians-400" />
                  {iStep < hari.steps.length - 1 ? (
                    <span className="w-px flex-1 bg-slate-200" />
                  ) : null}
                </div>

                <p className="pb-5 text-sm leading-relaxed">
                  {pickLocale(step.title, locale) ?? step.title.id}
                </p>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
