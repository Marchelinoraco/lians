import Image from 'next/image';
import { KLIEN } from '@/data/klien';
import { getMessages, type Locale } from '@/i18n';

export function OurClients({ locale }: { locale: Locale }) {
  const t = getMessages(locale);

  return (
    <section className="border-y border-slate-200 bg-white py-14">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-black sm:text-3xl">{t.clients.title}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-muted">{t.clients.subtitle}</p>
        </div>

        {/* Setiap logo diberi kotak berukuran sama dan diposisikan tengah dengan
            object-contain. Berkasnya sudah dipangkas ruang kosongnya, sehingga
            logo lebar dan logo persegi tampil dengan bobot yang sebanding. */}
        <ul className="grid grid-cols-2 items-center gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5">
          {KLIEN.map((klien) => (
            <li key={klien.slug} className="flex flex-col items-center gap-3">
              <div className="relative h-14 w-full">
                <Image
                  src={`/clients/${klien.slug}.png`}
                  alt={klien.nama}
                  fill
                  sizes="(max-width: 640px) 40vw, (max-width: 1024px) 25vw, 160px"
                  className="object-contain"
                />
              </div>
              <span className="text-center text-xs leading-tight text-muted">{klien.nama}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
