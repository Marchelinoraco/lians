'use client';

import Link from 'next/link';
import { Globe } from 'lucide-react';
import { cn } from '@/lib/cn';
import { LOCALES, LOCALE_LABELS, localeHref, getMessages, type Locale } from '@/i18n';

/**
 * Menautkan ke halaman yang sama dalam bahasa lain, bukan ke beranda.
 * Orang yang sedang membaca halaman Innova ingin membacanya dalam bahasa lain,
 * bukan dilempar kembali ke awal.
 */
export function LanguageSwitcher({ current, path }: { current: Locale; path: string }) {
  const t = getMessages(current);

  return (
    <nav aria-label={t.nav.language} className="flex items-center gap-0.5">
      <Globe className="mr-1 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
      {LOCALES.map((locale) => (
        <Link
          key={locale}
          href={localeHref(path, locale)}
          hrefLang={locale}
          aria-current={locale === current ? 'true' : undefined}
          className={cn(
            'rounded-md px-1.5 py-1 text-xs font-semibold transition-colors',
            locale === current
              ? 'bg-lians-50 text-lians-700'
              : 'text-slate-500 hover:text-lians-600',
          )}
        >
          {LOCALE_LABELS[locale]}
        </Link>
      ))}
    </nav>
  );
}
