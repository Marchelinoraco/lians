import Link from 'next/link';
import Image from 'next/image';
import type { Post } from '@/db/schema';
import { formatTanggal } from '@/lib/dates';
import { getMessages, pickLocale, localeHref, type Locale } from '@/i18n';

export function PostCard({ post, locale }: { post: Post; locale: Locale }) {
  const t = getMessages(locale);
  const judul = pickLocale(post.title, locale) ?? post.title.id;
  const ringkasan = pickLocale(post.excerpt, locale) ?? '';
  const sampul = post.coverImage[0];

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-shadow hover:shadow-lg">
      <div className="relative aspect-[16/9] bg-gradient-to-br from-lians-50 via-sky-50 to-slate-100">
        {sampul ? (
          <Image
            src={sampul.url}
            alt={sampul.alt || judul}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-5">
        <time dateTime={post.publishedAt} className="text-xs text-muted">
          {formatTanggal(new Date(post.publishedAt), locale)}
        </time>

        <h2 className="text-lg font-bold leading-snug">
          <Link
            href={localeHref(`/blog/${post.slug}`, locale)}
            className="after:absolute after:inset-0"
          >
            {judul}
          </Link>
        </h2>

        {ringkasan ? <p className="text-sm text-muted">{ringkasan}</p> : null}

        <p className="mt-auto pt-2 text-sm font-semibold text-lians-600">{t.blog.readMore} →</p>
      </div>
    </article>
  );
}
