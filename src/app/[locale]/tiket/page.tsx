import type { Metadata } from 'next';
import { Plane, Info } from 'lucide-react';
import { MASKAPAI } from '@/data/maskapai';
import { TicketRequestForm } from '@/components/ticket/TicketRequestForm';
import { buildAlternates } from '@/lib/seo';
import { getMessages, LOCALES, type Locale } from '@/i18n';

/** Daftar maskapai statis, jadi halaman ini dibuat penuh saat build. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Pemesanan Tiket Pesawat Manado — LIANS',
    description:
      'Pesan tiket pesawat dari dan ke Manado lewat LIANS. Kirimkan rute dan tanggalnya, kami cek ketersediaan lalu mengirim penawaran lewat WhatsApp.',
  },
  en: {
    title: 'Flight Booking in Manado — LIANS',
    description:
      'Book flights to and from Manado through LIANS. Send your route and dates, we check availability and reply with a quote on WhatsApp.',
  },
  zh: {
    title: '万鸦老机票预订 — LIANS',
    description:
      '通过 LIANS 预订往返万鸦老的机票。告知航线与日期，我们查询余位后以 WhatsApp 回复报价。',
  },
  ko: {
    title: '마나도 항공권 예약 — LIANS',
    description:
      'LIANS를 통해 마나도 출발·도착 항공권을 예약하세요. 노선과 날짜를 보내 주시면 좌석을 확인해 WhatsApp으로 견적을 드립니다.',
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/tiket', locale) };
}

export default async function TiketPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.ticket.title}</h1>
        <p className="max-w-2xl text-muted">{t.ticket.subtitle}</p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-4 flex items-center gap-2 font-bold">
          <Plane className="h-5 w-5 text-lians-500" aria-hidden />
          {t.ticket.airlinesTitle}
        </h2>

        {/* Nama saja, tanpa logo: logo maskapai adalah merek dagang pihak lain. */}
        <ul className="flex flex-wrap gap-2">
          {MASKAPAI.map((m) => (
            <li
              key={m.kode}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-1.5 text-sm font-medium"
            >
              {m.nama}
            </li>
          ))}
        </ul>

        <p className="mt-4 text-sm text-muted">{t.ticket.airlinesNote}</p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <h2 className="mb-2 flex items-center gap-2 font-bold text-amber-900">
          <Info className="h-5 w-5" aria-hidden />
          {t.ticket.whyNoPriceTitle}
        </h2>
        <p className="text-sm leading-relaxed text-amber-900">{t.ticket.whyNoPrice}</p>
      </section>

      <TicketRequestForm locale={locale} />
    </div>
  );
}
