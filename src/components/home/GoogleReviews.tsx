import Image from 'next/image';
import { Star, ExternalLink } from 'lucide-react';
import type { RingkasanUlasan } from '@/lib/google-reviews';
import { getMessages, fill, type Locale } from '@/i18n';

/** Profil Google LIANS, dipakai bila API belum disetel. */
const PROFIL_GOOGLE = 'https://www.google.com/search?kgmid=/g/11vzcbwdj7';

function Bintang({ nilai, ukuran = 'h-4 w-4' }: { nilai: number; ukuran?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${ukuran} ${n <= Math.round(nilai) ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
        />
      ))}
    </span>
  );
}

export function GoogleReviews({
  data,
  locale,
}: {
  data: RingkasanUlasan | null;
  locale: Locale;
}) {
  const t = getMessages(locale);

  // Tanpa kunci API, yang tampil hanya ajakan membaca di Google — bukan angka
  // atau kutipan karangan. Bintang palsu di beranda adalah bohong yang mudah
  // ketahuan dan mahal akibatnya.
  if (!data || data.ulasan.length === 0) {
    return (
      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-2xl font-black sm:text-3xl">{t.homeSections.reviewsTitle}</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">{t.homeSections.reviewsFallback}</p>
          <a
            href={PROFIL_GOOGLE}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-lians-400"
          >
            {t.homeSections.reviewsSeeAll}
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        </div>
      </section>
    );
  }

  const tautan = data.tautanProfil || PROFIL_GOOGLE;

  return (
    <section className="border-y border-slate-200 bg-slate-50 py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-black sm:text-3xl">{t.homeSections.reviewsTitle}</h2>
            <p className="max-w-xl text-muted">{t.homeSections.reviewsSubtitle}</p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="text-3xl font-black tabular-nums">{data.rating.toFixed(1)}</span>
              <Bintang nilai={data.rating} ukuran="h-5 w-5" />
              <span className="text-sm text-muted">
                {fill(t.homeSections.reviewsFrom, { n: data.jumlahUlasan })}
              </span>
            </div>
          </div>

          <a
            href={tautan}
            target="_blank"
            rel="noopener noreferrer"
            className="flex shrink-0 items-center gap-1.5 text-sm font-semibold text-lians-600"
          >
            {t.homeSections.reviewsSeeAll}
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>

        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.ulasan.slice(0, 3).map((u, i) => (
            <li
              key={`${u.penulis}-${i}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <Bintang nilai={u.bintang} />

              {/* Dipotong, bukan digulung: ulasan Google bisa sangat panjang,
                  dan kartu setinggi layar merusak susunan berandanya. */}
              <p className="line-clamp-6 text-sm leading-relaxed">{u.teks}</p>

              <div className="mt-auto flex items-center gap-3 border-t border-slate-100 pt-3">
                {u.fotoPenulis ? (
                  <Image
                    src={u.fotoPenulis}
                    alt=""
                    width={36}
                    height={36}
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-lians-50 text-sm font-bold text-lians-700">
                    {u.penulis.slice(0, 1).toUpperCase()}
                  </span>
                )}

                <span className="min-w-0">
                  {/* Nama penulis wajib ditampilkan — itu syarat Google untuk
                      menayangkan ulasan di luar platformnya. */}
                  <span className="block truncate text-sm font-semibold">{u.penulis}</span>
                  <span className="block text-xs text-muted">{u.waktuRelatif}</span>
                </span>
              </div>
            </li>
          ))}
        </ul>

        <p className="mt-5 text-xs text-muted">{t.homeSections.poweredByGoogle}</p>
      </div>
    </section>
  );
}
