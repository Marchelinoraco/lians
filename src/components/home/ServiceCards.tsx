import Link from 'next/link';
import { Key, UserRound, Bus, PlaneTakeoff } from 'lucide-react';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function ServiceCards({ locale }: { locale: Locale }) {
  const t = getMessages(locale);

  const LAYANAN = [
    {
      Icon: Key,
      title: t.home.serviceSelfDrive,
      desc: t.home.serviceSelfDriveDesc,
      href: '/mobil',
    },
    {
      Icon: UserRound,
      title: t.home.serviceWithDriver,
      desc: t.home.serviceWithDriverDesc,
      href: '/booking',
    },
    {
      Icon: Bus,
      title: t.home.serviceTourism,
      desc: t.home.serviceTourismDesc,
      href: '/mobil?category=bus',
    },
    {
      Icon: PlaneTakeoff,
      title: t.home.serviceAirport,
      desc: t.home.serviceAirportDesc,
      href: '/travel',
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-black sm:text-3xl">{t.home.ourServices}</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {LAYANAN.map(({ Icon, title, desc, href }) => (
          <Link
            key={title}
            href={localeHref(href, locale)}
            className="rounded-2xl border border-slate-200 p-6 transition-colors hover:border-lians-300 hover:bg-lians-50"
          >
            <Icon className="h-8 w-8 text-lians-500" aria-hidden />
            <h3 className="mt-4 font-bold">{title}</h3>
            <p className="mt-1 text-sm text-muted">{desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
