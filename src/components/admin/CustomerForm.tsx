'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Customer } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import {
  KELAS_ISIAN,
  KELAS_LABEL,
  KELAS_BANTUAN,
  KELAS_TOMBOL_UTAMA,
} from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

type Values = { name: string; phone: string; email: string; notes: string };

export function CustomerForm({
  customer,
  onSubmit,
}: {
  customer: Customer | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      name: customer?.name ?? '',
      phone: customer?.phone ?? '',
      email: customer?.email ?? '',
      notes: customer?.notes ?? '',
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit(v);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([f, p]) =>
        toast.error(`${f}: ${p.join(', ')}`),
      );
      return;
    }
    toast.success('Pelanggan tersimpan.');
    router.push('/pelanggan');
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-5 pb-2">
      <BagianForm judul="Data pelanggan" keterangan="Nomor WhatsApp dipakai untuk mencocokkan pesanan berikutnya.">
        <div className="space-y-5">
      <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Nama</span>
          <input {...register('name', { required: true })} className={KELAS_ISIAN} />
        </label>
        <label>
          <span className={KELAS_LABEL}>Nomor WhatsApp</span>
          <input
            {...register('phone', { required: true })}
            placeholder="081234567890"
            className={KELAS_ISIAN}
          />
          <span className={KELAS_BANTUAN}>
            Disimpan dalam format 62… agar satu orang tidak tercatat dua kali.
          </span>
        </label>
        <label>
          <span className={KELAS_LABEL}>Email (opsional)</span>
          <input type="email" {...register('email')} className={KELAS_ISIAN} />
        </label>
      </KolomForm>

      <label className="block">
        <span className={KELAS_LABEL}>Catatan internal</span>
        <textarea rows={3} {...register('notes')} className={KELAS_ISIAN} />
      </label>

        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan pelanggan'}
        </button>
        <Link href="/pelanggan" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
