'use client';

import { cn } from '@/lib/cn';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/i18n';

/**
 * Titik penanda memberi tahu sekilas bahasa mana yang masih kosong, sehingga
 * staf tidak perlu mengklik satu per satu untuk memeriksa.
 */
export function LocaleTabs({
  active,
  filled,
  onChange,
}: {
  active: Locale;
  filled: Record<Locale, boolean>;
  onChange: (locale: Locale) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1 border-b border-slate-200">
      {LOCALES.map((locale) => (
        <button
          key={locale}
          type="button"
          role="tab"
          aria-selected={locale === active}
          onClick={() => onChange(locale)}
          className={cn(
            'flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-semibold',
            locale === active
              ? 'border-lians-500 text-lians-700'
              : 'border-transparent text-slate-500 hover:text-slate-700',
          )}
        >
          {LOCALE_LABELS[locale]}
          <span
            aria-label={filled[locale] ? 'terisi' : 'belum diisi'}
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              filled[locale] ? 'bg-emerald-500' : 'bg-slate-300',
            )}
          />
        </button>
      ))}
    </div>
  );
}
