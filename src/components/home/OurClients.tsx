import Image from 'next/image';
import { KLIEN, type Klien } from '@/data/klien';
import { getMessages, type Locale } from '@/i18n';

function LogoKlien({ klien, salinan = false }: { klien: Klien; salinan?: boolean }) {
  return (
    <li
      // Salinan kedua hanya ada demi kemulusan gerakan; bagi pembaca layar ia
      // duplikat murni, jadi disembunyikan agar nama klien tidak terbaca dua kali.
      aria-hidden={salinan || undefined}
      className={`flex w-36 shrink-0 flex-col items-center gap-3 sm:w-44 ${
        salinan ? 'jalur-logo-salinan' : ''
      }`}
    >
      <div className="relative h-14 w-full">
        <Image
          src={`/clients/${klien.slug}.png`}
          alt={salinan ? '' : klien.nama}
          fill
          sizes="176px"
          className="object-contain"
        />
      </div>
      <span className="text-center text-xs leading-tight text-muted">{klien.nama}</span>
    </li>
  );
}

export function OurClients({ locale }: { locale: Locale }) {
  const t = getMessages(locale);

  return (
    <section className="border-y border-slate-200 bg-white py-14">
      <div className="mb-10 px-4 text-center">
        <h2 className="text-2xl font-black sm:text-3xl">{t.clients.title}</h2>
        <p className="mx-auto mt-2 max-w-2xl text-muted">{t.clients.subtitle}</p>
      </div>

      {/* Tepi kiri dan kanan dibuat memudar, bukan terpotong lurus — supaya
          logo terlihat masuk dan keluar, bukan tiba-tiba terpenggal. */}
      <div
        className="relative overflow-hidden"
        style={{
          maskImage:
            'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
        }}
      >
        <ul className="jalur-logo flex w-max items-start gap-4 sm:gap-8">
          {KLIEN.map((klien) => (
            <LogoKlien key={klien.slug} klien={klien} />
          ))}

          {/* Salinan kedua yang membuat perulangannya mulus. */}
          {KLIEN.map((klien) => (
            <LogoKlien key={`salinan-${klien.slug}`} klien={klien} salinan />
          ))}
        </ul>
      </div>
    </section>
  );
}
