'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/cn';
import type { VehicleImage } from '@/db/schema';

export function VehicleGallery({
  images,
  alt,
  emptyLabel,
}: {
  images: VehicleImage[];
  alt: string;
  emptyLabel: string;
}) {
  const [aktif, setAktif] = useState(0);

  if (images.length === 0) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-slate-100 text-muted">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100">
        <Image
          src={images[aktif].url}
          alt={images[aktif].alt || alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority
        />
      </div>

      {images.length > 1 ? (
        <ul className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <li key={img.publicId || img.url}>
              <button
                type="button"
                onClick={() => setAktif(i)}
                aria-label={`${alt} — ${i + 1}`}
                aria-current={i === aktif}
                className={cn(
                  'relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2',
                  i === aktif ? 'border-lians-500' : 'border-transparent',
                )}
              >
                <Image src={img.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
