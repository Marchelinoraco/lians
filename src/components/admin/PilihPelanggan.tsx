'use client';

import { useState } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { KELAS_ISIAN, KELAS_LABEL, KELAS_BANTUAN } from './kelas-form';

export type PilihanPelanggan = { id: string; name: string; phone: string; email: string | null };

/**
 * Isian nomor WhatsApp yang mengenali pelanggan lama.
 *
 * Pencocokan memakai sembilan angka terakhir, bukan seluruh nomor: 0811…,
 * +62811…, dan 62811… adalah orang yang sama, dan menyamakannya di sini
 * menghindari menormalkan nomor di sisi klien — pekerjaan yang sudah dilakukan
 * server saat menyimpan.
 *
 * Sembilan angka cukup panjang untuk tidak menabrak nomor lain (satu nomor
 * Indonesia hanya punya 9–12 angka setelah kode negara), dan cukup pendek
 * untuk tetap cocok betapa pun nomornya diketik.
 */
export function PilihPelanggan({
  pelanggan,
  onKetemu,
  daftar,
  label = 'Nomor WhatsApp',
}: {
  pelanggan: PilihanPelanggan[];
  onKetemu: (p: PilihanPelanggan) => void;
  /** Hasil register() dari react-hook-form untuk field nomornya. */
  daftar: UseFormRegisterReturn;
  label?: string;
}) {
  const [dikenali, setDikenali] = useState<string | null>(null);

  function cocokkan(nomor: string) {
    const bersih = nomor.replace(/\D/g, '');
    if (bersih.length < 8) {
      setDikenali(null);
      return;
    }

    const ketemu = pelanggan.find((p) => p.phone.endsWith(bersih.slice(-9)));
    if (!ketemu) {
      setDikenali(null);
      return;
    }

    onKetemu(ketemu);
    setDikenali(ketemu.name);
    toast.info(`Pelanggan dikenali: ${ketemu.name}`);
  }

  return (
    <label>
      <span className={KELAS_LABEL}>{label}</span>
      <input
        {...daftar}
        onBlur={(e) => {
          daftar.onBlur(e);
          cocokkan(e.target.value);
        }}
        placeholder="081234567890"
        className={KELAS_ISIAN}
      />
      <span className={KELAS_BANTUAN}>
        {dikenali
          ? `Pelanggan lama: ${dikenali}. Namanya sudah terisi.`
          : 'Bila nomor ini sudah pernah memesan, nama akan terisi sendiri.'}
      </span>
    </label>
  );
}
