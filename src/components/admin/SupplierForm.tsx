'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Supplier } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import {
  KELAS_ISIAN,
  KELAS_LABEL,
  KELAS_CENTANG,
  KELAS_TOMBOL_UTAMA,
} from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

type Values = { name: string; phone: string; notes: string; isActive: boolean };

export function SupplierForm({
  supplier,
  onSubmit,
}: {
  supplier: Supplier | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      name: supplier?.name ?? '',
      phone: supplier?.phone ?? '',
      notes: supplier?.notes ?? '',
      isActive: supplier?.isActive ?? true,
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
    toast.success('Pemasok tersimpan.');
    router.push('/pemasok');
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-5 pb-2">
      <BagianForm judul="Data pemasok">
        <div className="space-y-5">
      <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Nama pemasok</span>
          <input {...register('name', { required: true })} className={KELAS_ISIAN} />
        </label>
        <label>
          <span className={KELAS_LABEL}>Nomor WhatsApp (opsional)</span>
          <input {...register('phone')} placeholder="081234567890" className={KELAS_ISIAN} />
        </label>
      </KolomForm>

      <label className="block">
        <span className={KELAS_LABEL}>Catatan</span>
        <textarea rows={3} {...register('notes')} className={KELAS_ISIAN} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isActive')} className={KELAS_CENTANG} />
        Aktif — kendaraannya bisa dipilih saat mencatat booking manual
      </label>

        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan pemasok'}
        </button>
        <Link href="/pemasok" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
