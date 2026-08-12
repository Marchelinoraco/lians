'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Supplier } from '@/db/schema';
import type { ActionResult } from '@/actions/result';

type Values = { name: string; phone: string; notes: string; isActive: boolean };

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function SupplierForm({
  supplier,
  onSubmit,
}: {
  supplier: Supplier | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
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
    window.location.href = '/pemasok';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama pemasok</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp (opsional)</span>
          <input {...register('phone')} placeholder="081234567890" className={kelas} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Catatan</span>
        <textarea rows={3} {...register('notes')} className={kelas} />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isActive')} />
        Aktif — kendaraannya bisa dipilih saat mencatat booking manual
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan pemasok'}
      </button>
    </form>
  );
}
