import type { Metadata } from 'next';
import { getPublishedPosts } from '@/queries/posts';
import { PostCard } from '@/components/blog/PostCard';
import { buildAlternates } from '@/lib/seo';
import { getMessages, LOCALES, type Locale } from '@/i18n';

export const revalidate = 300;

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
    title: `${t.blog.title} — LIANS Manado`,
    description: t.blog.subtitle,
    alternates: buildAlternates('/blog', locale),
  };
}

export default async function BlogPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const t = getMessages(locale);
  const artikel = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-black sm:text-4xl">{t.blog.title}</h1>
        <p className="max-w-2xl text-muted">{t.blog.subtitle}</p>
      </header>

      {artikel.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
          {t.blog.empty}
        </p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {artikel.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      )}
    </div>
  );
}
