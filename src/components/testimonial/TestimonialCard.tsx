import { Star } from 'lucide-react';
import type { Testimonial } from '@/db/schema';
import { formatTanggal } from '@/lib/dates';
import { cn } from '@/lib/cn';
import { getMessages, fill, pickLocale, type Locale } from '@/i18n';

export function TestimonialCard({
  testimonial,
  locale,
}: {
  testimonial: Testimonial;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const ulasan = pickLocale(testimonial.reviewText, locale) ?? '';

  return (
    <figure className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5">
      <div
        role="img"
        aria-label={fill(t.testimonials.ratingLabel, { n: testimonial.rating })}
        className="flex gap-0.5"
      >
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            aria-hidden
            className={cn(
              'h-4 w-4',
              i <= testimonial.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300',
            )}
          />
        ))}
      </div>

      <blockquote className="flex-1 text-sm leading-relaxed text-slate-700">“{ulasan}”</blockquote>

      <figcaption className="border-t border-slate-100 pt-3 text-sm">
        <span className="font-semibold">{testimonial.customerName}</span>
        {testimonial.vehicleName ? (
          <span className="block text-xs text-muted">{testimonial.vehicleName}</span>
        ) : null}
        <span className="block text-xs text-muted">
          {formatTanggal(new Date(testimonial.date), locale)}
        </span>
      </figcaption>
    </figure>
  );
}
