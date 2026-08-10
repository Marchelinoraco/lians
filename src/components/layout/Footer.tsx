import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import type { SettingsInput } from '@/schemas/settings';
import { normalizePhone } from '@/lib/whatsapp';
import { getMessages, fill, pickLocale, localeHref, type Locale } from '@/i18n';
import { NAV_ITEMS } from './nav-items';

export function Footer({ settings, locale }: { settings: SettingsInput; locale: Locale }) {
  const t = getMessages(locale);
  const tahun = new Date().getFullYear();
  const wa = normalizePhone(settings.whatsappNumber);

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <p className="text-xl font-black tracking-wide text-lians-600">LIANS</p>
          <p className="text-sm leading-relaxed text-muted">{t.footer.tagline}</p>
        </div>

        <nav aria-label={t.footer.navigation} className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t.footer.navigation}</h2>
          <ul className="space-y-2">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={localeHref(item.href, locale)}
                  className="text-sm text-muted hover:text-lians-600"
                >
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t.footer.contactHeading}</h2>
          <ul className="space-y-3 text-sm text-muted">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
              <span>{settings.address}</span>
            </li>
            <li className="flex gap-2">
              <Phone className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
              <a href={`tel:${settings.phone}`}>{settings.phone}</a>
            </li>
            <li className="flex gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
              <a href={`https://wa.me/${wa}`}>{t.contact.whatsapp}</a>
            </li>
            {settings.email ? (
              <li className="flex gap-2">
                <Mail className="h-4 w-4 shrink-0 text-lians-500" aria-hidden />
                <a href={`mailto:${settings.email}`}>{settings.email}</a>
              </li>
            ) : null}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wide">{t.footer.hoursHeading}</h2>
          <p className="flex gap-2 text-sm text-muted">
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-lians-500" aria-hidden />
            <span>{pickLocale(settings.operatingHours, locale)}</span>
          </p>
        </div>
      </div>

      <div className="border-t border-slate-200 py-5 text-center text-xs text-muted">
        {fill(t.footer.rights, { tahun })}
      </div>
    </footer>
  );
}
