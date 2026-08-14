'use client';

import { useId, useState } from 'react';
import type { BulanTren } from '@/queries/tren';

/**
 * Dua warna kategorikal, urutannya tetap dan tidak pernah diputar.
 *
 * Pasangan ini sudah lolos pemeriksaan: ΔE 24,7 pada protanopia dan 33,6 pada
 * penglihatan normal, jauh di atas ambang. Jangan menggantinya tanpa menguji
 * ulang — dua biru yang "kelihatan berbeda" bagi kita bisa identik bagi
 * sebagian pembaca.
 */
const SERI = [
  { kunci: 'website' as const, label: 'Dari situs', warna: '#2a78d6' },
  { kunci: 'manual' as const, label: 'Dicatat manual', warna: '#eb6834' },
];

// viewBox selebar 600, bukan 100. Dengan lebar 100 yang direnggangkan, sumbu x
// terskala enam kali lipat dan sudut membulat ikut gepeng menjadi elips.
const LEBAR = 600;
const TINGGI = 190;
const PADDING_ATAS = 12;
const CELAH = 2; // pemisah berwarna latar antar-segmen tumpukan

export function GrafikPesanan({ data }: { data: BulanTren[] }) {
  const [aktif, setAktif] = useState<number | null>(null);
  const idJudul = useId();

  const maks = Math.max(1, ...data.map((d) => d.website + d.manual));
  const kosong = data.every((d) => d.website + d.manual === 0);

  const lebarSlot = LEBAR / data.length;
  // Dibatasi 24 unit: batang yang memenuhi slot menghilangkan udara di antaranya.
  const lebarBatang = Math.min(24, lebarSlot * 0.55);
  const skala = (n: number) => (n / maks) * (TINGGI - PADDING_ATAS);

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5">
      <figcaption className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={idJudul} className="font-bold">
          Pesanan per bulan
        </h2>
        <span className="text-xs text-muted">12 bulan terakhir</span>
      </figcaption>

      {/* Legenda selalu ada untuk dua seri; identitas tidak boleh hanya lewat warna. */}
      <ul className="mb-4 flex flex-wrap gap-4">
        {SERI.map((s) => (
          <li key={s.kunci} className="flex items-center gap-1.5 text-xs text-muted">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm"
              style={{ backgroundColor: s.warna }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
      </ul>

      {kosong ? (
        <p className="py-12 text-center text-sm text-muted">
          Belum ada pesanan dalam dua belas bulan terakhir.
        </p>
      ) : (
        <div className="relative">
          <svg
            viewBox={`0 0 ${LEBAR} ${TINGGI}`}
            preserveAspectRatio="none"
            className="h-48 w-full"
            role="img"
            aria-labelledby={idJudul}
          >
            {/* Garis bantu tipis dan solid, satu langkah dari latar. */}
            {[0.25, 0.5, 0.75, 1].map((f) => (
              <line
                key={f}
                x1="0"
                x2={LEBAR}
                y1={TINGGI - skala(maks * f)}
                y2={TINGGI - skala(maks * f)}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            {data.map((d, i) => {
              const tengah = i * lebarSlot + lebarSlot / 2;
              const lebar = lebarBatang;
              const x = tengah - lebar / 2;

              const tinggiManual = skala(d.manual);
              const tinggiWeb = skala(d.website);

              // Segmen atas dipangkas 2px agar ada celah berwarna latar di
              // antara keduanya — pemisahnya putih, bukan garis tepi.
              const yManual = TINGGI - tinggiManual;
              const yWeb = TINGGI - tinggiManual - tinggiWeb;

              return (
                <g
                  key={d.kunci}
                  onMouseEnter={() => setAktif(i)}
                  onMouseLeave={() => setAktif(null)}
                >
                  {/* Sasaran arahkan kursor lebih lebar dari batangnya. */}
                  <rect
                    x={i * lebarSlot}
                    y="0"
                    width={lebarSlot}
                    height={TINGGI}
                    fill="transparent"
                  />

                  {d.manual > 0 ? (
                    <rect
                      x={x}
                      y={yManual}
                      width={lebar}
                      height={tinggiManual}
                      fill={SERI[1].warna}
                      opacity={aktif === null || aktif === i ? 1 : 0.35}
                    />
                  ) : null}

                  {d.website > 0 ? (
                    <rect
                      x={x}
                      y={yWeb}
                      width={lebar}
                      height={Math.max(0, tinggiWeb - (d.manual > 0 ? CELAH : 0))}
                      fill={SERI[0].warna}
                      opacity={aktif === null || aktif === i ? 1 : 0.35}
                      rx="3"
                    />
                  ) : null}
                </g>
              );
            })}
          </svg>

          <div className="mt-1 flex">
            {data.map((d, i) => (
              <span
                key={d.kunci}
                className={`flex-1 text-center text-[10px] ${
                  aktif === i ? 'font-bold text-ink' : 'text-muted'
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>

          {aktif !== null ? (
            <div className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
              <p className="font-bold">
                {data[aktif].label} — {data[aktif].website + data[aktif].manual} pesanan
              </p>
              <p className="text-muted">
                {data[aktif].website} dari situs · {data[aktif].manual} dicatat manual
              </p>
            </div>
          ) : null}
        </div>
      )}

      {/* Tabel tersembunyi: angka tetap terbaca pembaca layar dan bisa disalin,
          tanpa bergantung pada kemampuan membedakan warna. */}
      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-lians-700">
          Lihat sebagai tabel
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1">Bulan</th>
              <th className="py-1">Dari situs</th>
              <th className="py-1">Manual</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.kunci} className="border-t border-slate-100">
                <td className="py-1">{d.label}</td>
                <td className="py-1 tabular-nums">{d.website}</td>
                <td className="py-1 tabular-nums">{d.manual}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
