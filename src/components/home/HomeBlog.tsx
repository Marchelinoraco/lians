import Link from 'next/link';
import type { Post } from '@/db/schema';
import { PostCard } from '@/components/blog/PostCard';
import { getMessages, localeHref, type Locale } from '@/i18n';

export function HomeBlog({ posts, locale }: { posts: Post[]; locale: Locale }) {
  const t = getMessages(locale);
  const tiga = posts.slice(0, 3);
  if (tiga.length === 0) return null;

  // Latar diselang-seling dengan seksi di atasnya. Dua bagian berlatar sama
  // yang berdempetan terbaca sebagai satu blok panjang berjudul dua.
  return (
    <section className="border-t border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-black sm:text-3xl">{t.homeSections.blogTitle}</h2>
            <p className="max-w-xl text-muted">{t.homeSections.blogSubtitle}</p>
          </div>
          <Link
            href={localeHref('/blog', locale)}
            className="shrink-0 text-sm font-semibold text-lians-600"
          >
            {t.common.viewAll} →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {tiga.map((post) => (
            <PostCard key={post.id} post={post} locale={locale} />
          ))}
        </div>
      </div>
    </section>
  );
}
