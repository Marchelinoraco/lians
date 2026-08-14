import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { TeksBerjenjang } from '@/components/ui/TeksBerjenjang';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function Hero({
  title,
  subtitle,
  locale,
}: {
  title: string;
  subtitle: string;
  locale: Locale;
}) {
  const t = getMessages(locale);

  // Ditarik ke atas lalu diberi padding sebesar itu lagi: gradasinya menembus
  // ke belakang pil yang mengambang, sementara isinya tetap bermula di bawahnya.
  return (
    <section className="-mt-[var(--tinggi-bilah)] border-b border-slate-200 bg-gradient-to-b from-lians-50 to-white pt-[var(--tinggi-bilah)]">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
        <p
          className="kata-muncul mb-5 items-center gap-1.5 rounded-full border border-black/[.06] bg-white px-4 py-1.5 text-xs font-semibold text-lians-700 shadow-sm"
          // display ditulis sebagai gaya sebaris karena kelas .kata-muncul
          // menetapkan inline-block; tanpa ini ikon pin terlempar ke atas teks.
          style={{ '--jeda': '0s', display: 'inline-flex' } as React.CSSProperties}
        >
          <MapPin className="h-3.5 w-3.5" aria-hidden /> {t.home.servingArea}
        </p>

        {/* Judul naik per kata; subjudul menyusul dengan jenjang lebih rapat
            supaya keduanya terasa satu gerakan, bukan dua animasi terpisah. */}
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
          <TeksBerjenjang teks={title} jeda={0.055} mulai={0.08} />
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-muted">
          <TeksBerjenjang teks={subtitle} jeda={0.028} mulai={0.3} />
        </p>

        <div
          className="kata-muncul mt-8 flex flex-wrap justify-center gap-3"
          style={{ '--jeda': '0.55s', display: 'flex' } as React.CSSProperties}
        >
          <Link
            href={localeHref('/mobil', locale)}
            className="rounded-full bg-lians-500 px-6 py-3 font-semibold text-white transition hover:bg-lians-600 active:scale-[.98]"
          >
            {t.home.viewFleet}
          </Link>
          <Link
            href={localeHref('/booking', locale)}
            className="rounded-full border border-slate-300 bg-white px-6 py-3 font-semibold transition hover:border-lians-400 active:scale-[.98]"
          >
            {t.common.bookNow}
          </Link>
        </div>
      </div>
    </section>
  );
}
