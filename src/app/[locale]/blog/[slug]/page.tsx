import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getPublishedPosts, getPublishedPostBySlug } from '@/queries/posts';
import { BlokArtikel } from '@/components/blog/BlokArtikel';
import { PostCard } from '@/components/blog/PostCard';
import { buildAlternates } from '@/lib/seo';
import { formatTanggal } from '@/lib/dates';
import { getMessages, pickLocale, localeHref, fill, LOCALES, type Locale } from '@/i18n';

export const revalidate = 300;

export async function generateStaticParams() {
  const artikel = await getPublishedPosts();
  return LOCALES.flatMap((locale) => artikel.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) return { title: 'LIANS' };

  const judul = pickLocale(post.title, locale) ?? post.title.id;
  const ringkasan = pickLocale(post.excerpt, locale) ?? '';
  const isi = pickLocale(post.body, locale) ?? [];

  return {
    title: `${judul} — LIANS Manado`,
    // Ringkasan dipakai bila ada; kalau kosong, paragraf pertama sudah lebih
    // memberi tahu daripada judul yang diulang.
    description: (ringkasan || isi[0] || '').slice(0, 300),
    alternates: buildAlternates(`/blog/${post.slug}`, locale),
    openGraph: {
      title: judul,
      description: ringkasan,
      type: 'article',
      publishedTime: post.publishedAt,
      images: post.coverImage[0] ? [post.coverImage[0].url] : [],
    },
  };
}

export default async function DetailArtikelPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;

  // getPublishedPostBySlug sudah menyaring artikel yang belum terbit, sehingga
  // draf menghasilkan 404 — bukan halaman yang bisa dibaca lewat tebakan slug.
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  const t = getMessages(locale);
  const judul = pickLocale(post.title, locale) ?? post.title.id;
  const ringkasan = pickLocale(post.excerpt, locale) ?? '';
  const isi = pickLocale(post.body, locale) ?? [];
  const sampul = post.coverImage[0];

  const lainnya = (await getPublishedPosts()).filter((p) => p.id !== post.id).slice(0, 3);

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-12">
      <nav className="text-sm text-muted">
        <Link href={localeHref('/blog', locale)} className="hover:text-lians-600">
          ← {t.blog.backToList}
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="text-sm text-muted">
          {fill(t.blog.publishedOn, { date: formatTanggal(new Date(post.publishedAt), locale) })}
        </p>
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">{judul}</h1>
        {ringkasan ? <p className="text-lg text-muted">{ringkasan}</p> : null}
      </header>

      {sampul ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-slate-100">
          <Image
            src={sampul.url}
            alt={sampul.alt || judul}
            fill
            sizes="(max-width: 1024px) 100vw, 768px"
            className="object-cover"
            priority
          />
        </div>
      ) : null}

      <article>
        <BlokArtikel baris={isi} />
      </article>

      {lainnya.length > 0 ? (
        <section className="space-y-5 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold">{t.blog.otherPosts}</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lainnya.map((p) => (
              <PostCard key={p.id} post={p} locale={locale} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
