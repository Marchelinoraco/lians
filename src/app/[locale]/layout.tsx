import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import '@/app/globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { WhatsAppFloat } from '@/components/layout/WhatsAppFloat';
import { getSettings } from '@/queries/settings';
import { normalizePhone } from '@/lib/whatsapp';
import { LOCALES, LOCALE_HTML_LANG, isLocale, getMessages } from '@/i18n';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const revalidate = 300;

/** Keempat bahasa dibangun sebagai halaman statis saat build. */
export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

/**
 * Ini root layout situs publik: <html> dan <body> ada di sini, bukan di
 * src/app/layout.tsx yang sengaja tidak dibuat.
 *
 * Alasannya atribut lang harus mengikuti bahasa halaman. Menaruh root layout
 * di app/layout.tsx memaksa bahasanya dibaca dari header permintaan, dan itu
 * membuat SELURUH halaman dirender per permintaan sehingga ISR tidak pernah
 * aktif. Dengan root layout di bawah segmen [locale], bahasanya datang dari
 * params dan keempat versi tetap dibangun sebagai HTML statis.
 */
export default async function PublicRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const settings = await getSettings();
  const whatsappUrl = `https://wa.me/${normalizePhone(settings.whatsappNumber)}`;

  return (
    <html lang={LOCALE_HTML_LANG[locale]} className={jakarta.variable}>
      <body className="font-sans antialiased">
    <div className="flex min-h-screen flex-col">
      <Header whatsappUrl={whatsappUrl} locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} locale={locale} />
      <WhatsAppFloat url={whatsappUrl} label={getMessages(locale).nav.contactUs} />
      <Toaster position="top-center" richColors />
    </div>
      </body>
    </html>
  );
}
