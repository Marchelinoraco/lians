import type { Metadata } from 'next';
import { MapPin, Phone, Mail, Clock, MessageCircle } from 'lucide-react';
import { getSettings } from '@/queries/settings';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Kontak LIANS — Jalan Pomorow, Manado',
    description:
      'Hubungi LIANS di Jalan Pomorow (Depan Luwansa Hotel), Kelurahan Banjer, Kecamatan Tikala, Manado 95125.',
  },
  en: {
    title: 'Contact LIANS — Jalan Pomorow, Manado',
    description:
      'Reach LIANS at Jalan Pomorow (in front of Luwansa Hotel), Banjer, Tikala, Manado 95125.',
  },
  zh: {
    title: '联系 LIANS — 万鸦老 Pomorow 路',
    description: '联系 LIANS：万鸦老 Tikala 区 Banjer Pomorow 路（Luwansa 酒店对面），邮编 95125。',
  },
  ko: {
    title: 'LIANS 문의 — 마나도 Pomorow 거리',
    description: '마나도 티칼라 반저르 포모로우 거리(루완사 호텔 앞) LIANS로 문의하세요.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/kontak', locale) };
}

export default async function KontakPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const settings = await getSettings();
  const petaSrc = `https://www.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-3xl font-black sm:text-4xl">{t.contact.title}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <ul className="space-y-5">
          <li className="flex gap-3">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.address}</p>
              <p className="text-sm text-muted">{settings.address}</p>
            </div>
          </li>

          <li className="flex gap-3">
            <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.whatsapp}</p>
              <a
                href={waLink(settings.whatsappNumber, 'Halo LIANS, saya ingin bertanya.')}
                className="text-sm text-lians-600"
              >
                {settings.whatsappNumber}
              </a>
            </div>
          </li>

          <li className="flex gap-3">
            <Phone className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.phone}</p>
              <a href={`tel:${settings.phone}`} className="text-sm text-lians-600">
                {settings.phone}
              </a>
            </div>
          </li>

          {settings.email ? (
            <li className="flex gap-3">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
              <div>
                <p className="font-semibold">{t.contact.email}</p>
                <a href={`mailto:${settings.email}`} className="text-sm text-lians-600">
                  {settings.email}
                </a>
              </div>
            </li>
          ) : null}

          <li className="flex gap-3">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-lians-500" aria-hidden />
            <div>
              <p className="font-semibold">{t.contact.hours}</p>
              <p className="text-sm text-muted">{pickLocale(settings.operatingHours, locale)}</p>
            </div>
          </li>
        </ul>

        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <iframe
            title={t.contact.mapTitle}
            src={settings.mapsUrl || petaSrc}
            className="h-80 w-full lg:h-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
