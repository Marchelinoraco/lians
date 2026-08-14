'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Memunculkan isinya saat tergulir sampai ke layar.
 *
 * Memakai IntersectionObserver, bukan penanda posisi gulir: pengamat hanya
 * bekerja saat elemennya benar-benar melintas, sedangkan mendengarkan peristiwa
 * scroll berarti menjalankan perhitungan pada setiap piksel gulir.
 *
 * Elemen dilepas dari pengamatan setelah muncul — animasinya sekali jalan, dan
 * membiarkannya terpantau berarti membayar biaya untuk sesuatu yang sudah
 * selesai.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  /** Detik. Untuk memberi jeda antar-blok yang muncul berurutan. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Peramban tanpa IntersectionObserver langsung menampilkan isinya.
    // Halaman kosong jauh lebih buruk daripada halaman tanpa animasi.
    if (typeof IntersectionObserver === 'undefined') {
      el.dataset.reveal = 'tampil';
      return;
    }

    const pengamat = new IntersectionObserver(
      (entri) => {
        for (const e of entri) {
          if (!e.isIntersecting) continue;
          el.dataset.reveal = 'tampil';
          pengamat.unobserve(el);
        }
      },
      // Dimundurkan 80px dari tepi bawah supaya elemen sudah selesai muncul
      // ketika benar-benar terbaca, bukan baru mulai bergerak saat dilihat.
      { rootMargin: '0px 0px -80px 0px', threshold: 0.05 },
    );

    pengamat.observe(el);
    return () => pengamat.disconnect();
  }, []);

  return (
    <div ref={ref} data-reveal="" style={{ animationDelay: `${delay}s` }} className={className}>
      {children}
    </div>
  );
}
