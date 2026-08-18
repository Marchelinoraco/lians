import Image from 'next/image';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import type { GalleryItem } from '@/db/schema';
import { TeksBerjenjang } from '@/components/ui/TeksBerjenjang';
import { getMessages, localeHref, type Locale } from '@/i18n';

/**
 * Banyaknya takuk dalam satu putaran latar.
 *
 * Angkanya tetap karena persentase keyframe di globals.css tidak dapat
 * dihitung dari jumlah foto — CSS tidak mengizinkan variabel di dalam
 * persentase keyframe. Enam dipilih agar tiap foto tampil enam detik dalam
 * putaran 36 detik: cukup lama untuk dilihat, cukup pendek untuk kembali
 * sebelum pengunjung selesai membaca halaman.
 */
const TAKUK_LATAR = 6;

export function Hero({
  title,
  subtitle,
  locale,
  galeri,
}: {
  title: string;
  subtitle: string;
  locale: Locale;
  galeri: GalleryItem[];
}) {
  const t = getMessages(locale);

  const tersedia = galeri.map((g) => g.image[0]).filter(Boolean);

  // Galeri yang lebih pendek dari enam diulang sampai keenam takuk terisi.
  // Tanpa itu, sisa takuknya menjadi jeda panjang tempat hero tampil gelap
  // tanpa gambar sama sekali — terlihat seperti fotonya gagal dimuat.
  const latar =
    tersedia.length === 0
      ? []
      : Array.from({ length: TAKUK_LATAR }, (_, i) => tersedia[i % tersedia.length]);

  // Ditarik ke atas lalu diberi padding sebesar itu lagi: latarnya menembus
  // ke belakang pil yang mengambang, sementara isinya tetap bermula di bawahnya.
  return (
    <section className="relative isolate -mt-[var(--tinggi-bilah)] overflow-hidden bg-gradient-to-b from-lians-800 to-slate-900 pt-[var(--tinggi-bilah)]">
      {/* Latar dekoratif: tidak menyampaikan makna apa pun yang belum ada di
          teks, jadi disembunyikan dari pembaca layar dan diberi alt kosong. */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {latar.map((foto, i) => (
          <Image
            key={`${foto.url}-${i}`}
            src={foto.url}
            alt=""
            fill
            // Hanya foto pertama yang didahulukan; lima sisanya baru terlihat
            // setelah enam detik, dan mendahulukan semuanya justru memperlambat
            // yang benar-benar tampil lebih dulu.
            priority={i === 0}
            sizes="100vw"
            className="hero-silih object-cover"
            style={{ '--urutan': i } as CSSProperties}
          />
        ))}
        <div className="absolute inset-0 bg-slate-950/60" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 text-center sm:pb-28 sm:pt-24">
        {/* Judul naik per kata; subjudul menyusul dengan jenjang lebih rapat
            supaya keduanya terasa satu gerakan, bukan dua animasi terpisah. */}
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl">
          <TeksBerjenjang teks={title} jeda={0.055} mulai={0.08} />
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-white/85">
          <TeksBerjenjang teks={subtitle} jeda={0.02} mulai={0.3} />
        </p>

        <div
          className="kata-muncul mt-8 flex flex-wrap justify-center gap-3"
          style={{ '--jeda': '0.55s', display: 'flex' } as CSSProperties}
        >
          <Link
            href={localeHref('/mobil', locale)}
            className="rounded-full bg-lians-500 px-6 py-3 font-semibold text-white transition hover:bg-lians-600 active:scale-[.98]"
          >
            {t.home.viewFleet}
          </Link>
          <Link
            href={localeHref('/booking', locale)}
            className="rounded-full border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white backdrop-blur transition hover:bg-white/20 active:scale-[.98]"
          >
            {t.common.bookNow}
          </Link>
        </div>
      </div>
    </section>
  );
}
