import type { Metadata } from 'next';
import { getPublishedTestimonials } from '@/queries/testimonials';
import { getPublishedGallery } from '@/queries/gallery';
import { GaleriGrid } from '@/components/gallery/GaleriGrid';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import { getMessages, type Locale } from '@/i18n';
import { buildAlternates } from '@/lib/seo';

export const revalidate = 300;

const META: Record<Locale, { title: string; description: string }> = {
  id: {
    title: 'Testimoni Pelanggan — LIANS Manado',
    description: 'Pengalaman pelanggan yang telah menyewa mobil di LIANS Manado.',
  },
  en: {
    title: 'Customer Reviews — LIANS Manado',
    description: 'What customers say after renting with LIANS in Manado.',
  },
  zh: { title: '客户评价 — 万鸦老 LIANS', description: '在万鸦老 LIANS 租车的客户真实评价。' },
  ko: { title: '고객 후기 — 마나도 LIANS', description: '마나도 LIANS에서 렌트한 고객들의 후기입니다.' },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return { ...META[locale], alternates: buildAlternates('/testimoni', locale) };
}

export default async function TestimoniPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const [semua, galeri] = await Promise.all([
    getPublishedTestimonials(),
    getPublishedGallery(),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.testimonials.title}</h1>
        <p className="max-w-2xl text-muted">{t.testimonials.subtitle}</p>
      </header>

      {semua.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          {t.testimonials.empty}
        </p>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {semua.map((item) => (
            <TestimonialCard key={item.id} testimonial={item} locale={locale} />
          ))}
        </div>
      )}

      {/* Galeri disembunyikan seluruhnya selama belum ada foto — judul bagian
          yang berdiri di atas ruang kosong terlihat seperti halaman rusak. */}
      {galeri.length > 0 ? (
        <section className="space-y-4 border-t border-slate-200 pt-10">
          <div className="space-y-1">
            <h2 className="text-2xl font-black sm:text-3xl">{t.gallery.title}</h2>
            <p className="max-w-2xl text-muted">{t.gallery.subtitle}</p>
          </div>
          <GaleriGrid items={galeri} locale={locale} />
        </section>
      ) : null}
    </div>
  );
}
