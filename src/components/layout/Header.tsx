'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [tergulir, setTergulir] = useState(false);

  // Bayangan pil dipertegas begitu halaman digulir. Saat masih di puncak,
  // bilah yang terlalu tebal justru mengganggu; setelah konten lewat di
  // baliknya, batas yang jelas membuatnya terbaca sebagai lapisan terpisah.
  useEffect(() => {
    const cek = () => setTergulir(window.scrollY > 8);
    cek();
    window.addEventListener('scroll', cek, { passive: true });
    return () => window.removeEventListener('scroll', cek);
  }, []);

  // Menu mobile ditutup saat pindah halaman. Tanpa ini, panelnya tetap terbuka
  // menutupi halaman tujuan.
  useEffect(() => setTerbuka(false), [pathname]);

  return (
    <header className="fixed inset-x-3 top-3 z-50 sm:inset-x-6 sm:top-5">
      <div
        className={cn(
          'mx-auto max-w-6xl rounded-3xl border border-black/[.06] bg-white/85 backdrop-blur-xl transition-[box-shadow,background-color] duration-300 xl:rounded-full',
          tergulir ? 'bg-white/95 shadow-[0_6px_24px_rgba(15,23,42,.08)]' : 'shadow-sm',
        )}
      >
        <nav
          aria-label={t.nav.home}
          className="relative flex h-14 items-center justify-between pl-4 pr-2 sm:h-16 sm:pl-5 sm:pr-3"
        >
          <Link
            href={localeHref('/', locale)}
            className="flex shrink-0 items-center"
            aria-label="LIANS"
          >
            <Image src="/logo-lians.png" alt="LIANS" width={116} height={18} priority />
          </Link>

          {/* Menu dipusatkan secara absolut, bukan lewat flex: dengan begitu
              posisinya tetap di tengah pil meski lebar logo dan tombol kanan
              berbeda-beda antarbahasa.

              Ambangnya xl, bukan lg: dengan sembilan menu, pada 1024px menu
              terakhir bertabrakan dengan pemilih bahasa. Di bawah 1280px
              dipakai tombol menu. */}
          <div className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-0.5 xl:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={localeHref(item.href, locale)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-2 text-[13px] font-medium transition-colors',
                  rest === item.href
                    ? 'bg-lians-50 text-lians-700'
                    : 'text-slate-600 hover:bg-black/[.045] hover:text-lians-600',
                )}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <div className="hidden sm:block">
              <LanguageSwitcher current={locale} path={rest} />
            </div>

            <a
              href={whatsappUrl}
              className="hidden whitespace-nowrap rounded-full bg-lians-500 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-lians-600 active:scale-[.98] md:inline-block"
            >
              {t.nav.contactUs}
            </a>

            <button
              type="button"
              onClick={() => setTerbuka((v) => !v)}
              aria-expanded={terbuka}
              aria-label={terbuka ? t.nav.closeMenu : t.nav.openMenu}
              className="grid h-9 w-9 place-items-center rounded-full border border-black/[.08] bg-white transition hover:border-lians-300 xl:hidden"
            >
              {terbuka ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </nav>

        {terbuka ? (
          <div className="border-t border-black/[.06] px-2 pb-2 xl:hidden">
            <ul className="pt-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={localeHref(item.href, locale)}
                    className="block rounded-2xl px-3 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-black/[.04]"
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="mt-1 border-t border-black/[.06] px-1 pt-3 sm:hidden">
              <LanguageSwitcher current={locale} path={rest} />
            </div>
          </div>
        ) : null}
      </div>
    </header>
  );
}
