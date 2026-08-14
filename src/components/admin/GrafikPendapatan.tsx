'use client';

import { useId, useState } from 'react';
import type { BulanTren } from '@/queries/tren';
import { formatRupiah } from '@/lib/format';

/**
 * Satu seri, jadi satu hue — bukan palet kategorikal.
 *
 * Tanpa legenda: judulnya sudah menyebut apa yang digambar, dan kotak legenda
 * untuk satu seri hanya menambah benda di layar tanpa memberi tahu apa pun.
 */
const WARNA = '#2a78d6';

const LEBAR = 600;
const TINGGI = 190;
const PADDING_ATAS = 16;

export function GrafikPendapatan({ data }: { data: BulanTren[] }) {
  const [aktif, setAktif] = useState<number | null>(null);
  const idJudul = useId();
  const idGradien = useId();

  const maks = Math.max(1, ...data.map((d) => d.pendapatan));
  const kosong = data.every((d) => d.pendapatan === 0);

  // Titik diletakkan di TENGAH slot, bukan di tepinya. Dengan x = i * lebar,
  // titik pertama dan terakhir menempel pada tepi gambar sehingga garisnya
  // terpotong — dan labelnya meleset setengah slot dari titiknya.
  const lebarSlot = LEBAR / data.length;
  const titikY = (n: number) => TINGGI - (n / maks) * (TINGGI - PADDING_ATAS);
  const titikX = (i: number) => i * lebarSlot + lebarSlot / 2;

  const garis = data.map((d, i) => `${titikX(i)},${titikY(d.pendapatan)}`).join(' ');
  const area = `${titikX(0)},${TINGGI} ${garis} ${titikX(data.length - 1)},${TINGGI}`;

  const total = data.reduce((n, d) => n + d.pendapatan, 0);

  return (
    <figure className="rounded-2xl border border-slate-200 bg-white p-5">
      <figcaption className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h2 id={idJudul} className="font-bold">
            Pendapatan per bulan
          </h2>
          <p className="text-xs text-muted">
            Pesanan terkonfirmasi dan selesai · 12 bulan terakhir
          </p>
        </div>
        <span className="text-lg font-black tabular-nums">{formatRupiah(total)}</span>
      </figcaption>

      {kosong ? (
        <p className="py-12 text-center text-sm text-muted">
          Belum ada pendapatan tercatat dalam dua belas bulan terakhir.
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
            <defs>
              <linearGradient id={idGradien} x1="0" y1="0" x2="0" y2="1">
                {/* Isian area sebagai sapuan tipis, bukan blok pekat. */}
                <stop offset="0%" stopColor={WARNA} stopOpacity="0.16" />
                <stop offset="100%" stopColor={WARNA} stopOpacity="0.02" />
              </linearGradient>
            </defs>

            {[0.5, 1].map((f) => (
              <line
                key={f}
                x1="0"
                x2={LEBAR}
                y1={titikY(maks * f)}
                y2={titikY(maks * f)}
                stroke="#e2e8f0"
                strokeWidth="0.5"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <polygon points={area} fill={`url(#${idGradien})`} />

            <polyline
              points={garis}
              fill="none"
              stroke={WARNA}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />

            {data.map((d, i) => (
              <g key={d.kunci} onMouseEnter={() => setAktif(i)} onMouseLeave={() => setAktif(null)}>
                <rect
                  x={titikX(i) - lebarSlot / 2}
                  y="0"
                  width={lebarSlot}
                  height={TINGGI}
                  fill="transparent"
                />
                {aktif === i ? (
                  <>
                    <line
                      x1={titikX(i)}
                      x2={titikX(i)}
                      y1="0"
                      y2={TINGGI}
                      stroke="#94a3b8"
                      strokeWidth="1"
                      vectorEffect="non-scaling-stroke"
                    />
                    {/* Cincin berwarna latar 2px memisahkan titik dari garis. */}
                    <circle
                      cx={titikX(i)}
                      cy={titikY(d.pendapatan)}
                      r="5"
                      fill={WARNA}
                      stroke="#ffffff"
                      strokeWidth="2"
                      vectorEffect="non-scaling-stroke"
                    />
                  </>
                ) : null}
              </g>
            ))}
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
              <p className="font-bold">{formatRupiah(data[aktif].pendapatan)}</p>
              <p className="text-muted">{data[aktif].label}</p>
            </div>
          ) : null}
        </div>
      )}

      <details className="mt-4">
        <summary className="cursor-pointer text-xs font-semibold text-lians-700">
          Lihat sebagai tabel
        </summary>
        <table className="mt-2 w-full text-xs">
          <thead className="text-left text-muted">
            <tr>
              <th className="py-1">Bulan</th>
              <th className="py-1">Pendapatan</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.kunci} className="border-t border-slate-100">
                <td className="py-1">{d.label}</td>
                <td className="py-1 tabular-nums">{formatRupiah(d.pendapatan)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
