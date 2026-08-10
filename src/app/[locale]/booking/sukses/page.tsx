import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getMessages, fill, localeHref, type Locale } from '@/i18n';

export const metadata = { title: 'LIANS', robots: { index: false } };

export default async function SuksesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ kode?: string; wa?: string }>;
}) {
  const [{ locale }, { kode, wa }] = await Promise.all([params, searchParams]);
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" aria-hidden />
      <h1 className="mt-4 text-2xl font-black">{t.booking.successTitle}</h1>
      <p className="mt-2 text-muted">{fill(t.booking.successBody, { kode: kode ?? '-' })}</p>

      {wa ? (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
        >
          {t.booking.continueWhatsApp}
        </a>
      ) : null}

      <p className="mt-8 text-sm text-muted">{t.booking.successFooter}</p>

      <Link
        href={localeHref('/mobil', locale)}
        className="mt-4 inline-block text-sm font-semibold text-lians-600"
      >
        {t.booking.seeOtherVehicles}
      </Link>
    </div>
  );
}
