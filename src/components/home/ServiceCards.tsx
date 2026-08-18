import Link from 'next/link';
import { Car, Plane, Map } from 'lucide-react';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function ServiceCards({ locale }: { locale: Locale }) {
  const t = getMessages(locale);

  // Tiga lini usaha LIANS, bukan tiga jenis sewa: pengunjung beranda perlu
  // tahu lebih dulu bahwa tiket pesawat dan paket wisata pun dilayani di sini.
  // Jenis sewanya — lepas kunci atau dengan sopir — disebut di deskripsi kartu
  // pertama, dan dipilih di halaman kendaraannya.
  const LAYANAN = [
    {
      Icon: Car,
      title: t.home.serviceRental,
      desc: t.home.serviceRentalDesc,
      href: '/mobil',
    },
    {
      Icon: Plane,
      title: t.home.serviceFlight,
      desc: t.home.serviceFlightDesc,
      href: '/tiket',
    },
    {
      Icon: Map,
      title: t.home.serviceTour,
      desc: t.home.serviceTourDesc,
      href: '/tours',
    },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16">
      <h2 className="text-center text-2xl font-black sm:text-3xl">{t.home.ourServices}</h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
