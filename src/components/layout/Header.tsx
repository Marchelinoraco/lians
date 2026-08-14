'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { getMessages, localeHref, splitLocalePath, type Locale } from '@/i18n';
import { LanguageSwitcher } from './LanguageSwitcher';
import { NAV_ITEMS } from './nav-items';

export function Header({ whatsappUrl, locale }: { whatsappUrl: string; locale: Locale }) {
  const t = getMessages(locale);
  const pathname = usePathname();
  const { rest } = splitLocalePath(pathname);
  const [terbuka, setTerbuka] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={localeHref('/', locale)} className="flex shrink-0 items-center" aria-label="LIANS">
          <Image src="/logo-lians.png" alt="LIANS" width={132} height={20} priority />
        </Link>

        {/* min-w-0 memberi izin nav menyusut alih-alih mendesak logo dan tombol
            di sebelahnya; keduanya sudah shrink-0. */}
        <nav aria-label={t.nav.home} className="hidden min-w-0 items-center gap-0.5 lg:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={localeHref(item.href, locale)}
              className={cn(
                // whitespace-nowrap wajib: tanpa itu, menu yang terdesak akan
                // memecah labelnya per kata — dan pada bahasa Mandarin dan
                // Korea, per aksara.
                'whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                rest === item.href
                  ? 'bg-lians-50 text-lians-700'
                  : 'text-slate-600 hover:text-lians-600',
              )}
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <div className="hidden sm:block">
            <LanguageSwitcher current={locale} path={rest} />
          </div>
          <a
            href={whatsappUrl}
            className="hidden whitespace-nowrap rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600 md:inline-block"
          >
            {t.nav.contactUs}
          </a>
          <button
            type="button"
            onClick={() => setTerbuka((v) => !v)}
            aria-expanded={terbuka}
            aria-label={terbuka ? t.nav.closeMenu : t.nav.openMenu}
            className="rounded-lg p-2 lg:hidden"
          >
            {terbuka ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {terbuka ? (
        <nav aria-label={t.nav.openMenu} className="border-t border-slate-200 lg:hidden">
          <ul className="mx-auto max-w-6xl px-4 py-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={localeHref(item.href, locale)}
                  onClick={() => setTerbuka(false)}
                  className="block py-3 text-sm font-medium text-slate-700"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-200 px-4 py-3 sm:hidden">
            <LanguageSwitcher current={locale} path={rest} />
          </div>
        </nav>
      ) : null}
    </header>
  );
}
