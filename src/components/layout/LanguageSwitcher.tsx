'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import {
  LOCALES,
  LOCALE_LABELS,
  LOCALE_SHORT,
  localeHref,
  getMessages,
  type Locale,
} from '@/i18n';

/**
 * Menautkan ke halaman yang sama dalam bahasa lain, bukan ke beranda.
 * Orang yang sedang membaca halaman Innova ingin membacanya dalam bahasa lain,
 * bukan dilempar kembali ke awal.
 *
 * Berbentuk daftar yang dibuka, bukan empat tautan berjejer: nama keempat
 * bahasa sekaligus memakan sekitar 300 piksel, dan di bilah atas yang sudah
 * berisi delapan menu, sisanya terdesak sampai 中文 dan 한국어 terpecah menjadi
 * beberapa baris per aksara.
 */
export function LanguageSwitcher({ current, path }: { current: Locale; path: string }) {
  const t = getMessages(current);
  const [terbuka, setTerbuka] = useState(false);
  const wadah = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!terbuka) return;

    function klikDiLuar(e: MouseEvent) {
      if (!wadah.current?.contains(e.target as Node)) setTerbuka(false);
    }

    function tekanEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setTerbuka(false);
    }

    document.addEventListener('mousedown', klikDiLuar);
    document.addEventListener('keydown', tekanEscape);
    return () => {
      document.removeEventListener('mousedown', klikDiLuar);
      document.removeEventListener('keydown', tekanEscape);
    };
  }, [terbuka]);

  return (
    <div ref={wadah} className="relative">
      <button
        type="button"
        onClick={() => setTerbuka((v) => !v)}
        aria-expanded={terbuka}
        aria-controls="daftar-bahasa"
        aria-label={t.nav.language}
        className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition-colors hover:text-lians-600"
      >
        <Globe className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
        {LOCALE_SHORT[current]}
        <ChevronDown
          className={cn('h-3.5 w-3.5 shrink-0 transition-transform', terbuka && 'rotate-180')}
          aria-hidden
        />
      </button>

      {terbuka ? (
        // Sengaja BUKAN role="menu"/"menuitem": pola ARIA itu untuk menu
        // aplikasi yang dinavigasi tombol panah. Ini sekadar daftar tautan,
        // dan menandainya sebagai menu justru menghilangkan peran "link" yang
        // sudah dikenali pembaca layar. Pola yang tepat: disclosure —
        // tombol ber-aria-expanded yang membuka daftar biasa.
        <ul
          id="daftar-bahasa"
          className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
        >
          {LOCALES.map((locale) => {
            const aktif = locale === current;

            return (
              <li key={locale}>
                <Link
                  href={localeHref(path, locale)}
                  hrefLang={locale}
                  aria-current={aktif ? 'true' : undefined}
                  onClick={() => setTerbuka(false)}
                  className={cn(
                    'flex items-center justify-between gap-2 px-4 py-2.5 text-sm transition-colors',
                    aktif
                      ? 'bg-lians-50 font-semibold text-lians-700'
                      : 'text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {LOCALE_LABELS[locale]}
                  {aktif ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
