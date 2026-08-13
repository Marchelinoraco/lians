import type { Metadata } from 'next';
import { MessageCircle } from 'lucide-react';
import { SYARAT_KETENTUAN, SYARAT_BERLAKU_SEJAK } from '@/data/syarat-ketentuan';
import { getSettings } from '@/queries/settings';
import { buildAlternates } from '@/lib/seo';
import { formatTanggal } from '@/lib/dates';
import { waLink } from '@/lib/whatsapp';
import { getMessages, pickLocale, fill, LOCALES, type Locale } from '@/i18n';

/** Isinya statis di repo, jadi halaman ini dibuat penuh saat build. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = getMessages(locale);

  return {
    title: `${t.terms.title} — LIANS`,
    description: t.terms.subtitle,
    alternates: buildAlternates('/syarat-ketentuan', locale),
  };
}

export default async function SyaratKetentuanPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const t = getMessages(locale);
  const settings = await getSettings();

  const berlaku = formatTanggal(new Date(SYARAT_BERLAKU_SEJAK), locale);

  return (
    <div className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.terms.title}</h1>
        <p className="text-muted">{t.terms.subtitle}</p>
        <p className="text-sm text-muted">{fill(t.terms.effectiveSince, { date: berlaku })}</p>
      </header>

      {/* Daftar isi: dokumen ini panjang, dan orang biasanya datang mencari satu
          pasal tertentu — biasanya soal jaminan atau kerusakan. */}
      <nav aria-label={t.terms.tocTitle} className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">
          {t.terms.tocTitle}
        </h2>
        <ol className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
          {SYARAT_KETENTUAN.map((bagian, i) => (
            <li key={bagian.id}>
              <a href={`#${bagian.id}`} className="text-lians-700 hover:underline">
                {i + 1}. {pickLocale(bagian.judul, locale) ?? bagian.judul.id}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="space-y-10">
        {SYARAT_KETENTUAN.map((bagian, i) => {
          const isi = pickLocale(bagian.isi, locale) ?? bagian.isi.id;

          return (
            <section key={bagian.id} id={bagian.id} className="scroll-mt-24">
              <h2 className="mb-4 text-xl font-bold">
                <span className="text-lians-500">{i + 1}.</span>{' '}
                {pickLocale(bagian.judul, locale) ?? bagian.judul.id}
              </h2>
              <ul className="space-y-3">
                {isi.map((butir, j) => (
                  <li key={j} className="flex gap-3 text-sm leading-relaxed">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-lians-300"
                      aria-hidden
                    />
                    <span>{butir}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <section className="rounded-2xl border border-lians-200 bg-lians-50 p-6">
        <h2 className="mb-2 flex items-center gap-2 font-bold">
          <MessageCircle className="h-5 w-5 text-lians-500" aria-hidden />
          {t.terms.questionTitle}
        </h2>
        <p className="text-sm leading-relaxed text-muted">{t.terms.questionBody}</p>
        <a
          href={waLink(
            settings.whatsappNumber,
            'Halo LIANS, saya ingin bertanya tentang syarat dan ketentuan sewa.',
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          {t.terms.askWhatsApp}
        </a>
      </section>
    </div>
  );
}
