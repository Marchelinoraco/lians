import { formatRupiah } from '@/lib/format';
import type { PriceBreakdown } from '@/lib/pricing';
import { getMessages, fill, type Locale } from '@/i18n';

export function PriceSummary({
  breakdown,
  pesan,
  locale,
}: {
  breakdown: PriceBreakdown | null;
  pesan?: string;
  locale: Locale;
}) {
  const t = getMessages(locale);

  if (!breakdown) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-muted">
        {pesan ?? t.booking.estimateHint}
      </div>
    );
  }

  const baris = [
    {
      label: fill(t.booking.rentalLine, {
        days: breakdown.days,
        harga: formatRupiah(breakdown.ratePerDay),
      }),
      nilai: breakdown.rentalCost,
    },
    ...(breakdown.driverDays > 0
      ? [
          {
            label: fill(t.booking.driverLine, {
              days: breakdown.driverDays,
              harga: formatRupiah(breakdown.driverFeePerDay),
            }),
            nilai: breakdown.driverCost,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-3 rounded-2xl border border-lians-200 bg-lians-50 p-5">
      <h2 className="font-bold">{t.booking.estimate}</h2>
      <dl className="space-y-2 text-sm">
        {baris.map((b) => (
          <div key={b.label} className="flex justify-between gap-3">
            <dt className="text-slate-600">{b.label}</dt>
            <dd className="font-medium">{formatRupiah(b.nilai)}</dd>
          </div>
        ))}
      </dl>
      <div className="flex justify-between border-t border-lians-200 pt-3">
        <span className="font-bold">{t.booking.total}</span>
        <span className="text-xl font-black text-lians-700">{formatRupiah(breakdown.total)}</span>
      </div>
      <p className="text-xs text-muted">{t.booking.excludesNote}</p>
    </div>
  );
}
