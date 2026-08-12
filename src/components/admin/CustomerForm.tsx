'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Customer } from '@/db/schema';
import type { ActionResult } from '@/actions/result';

type Values = { name: string; phone: string; email: string; notes: string };

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function CustomerForm({
  customer,
  onSubmit,
}: {
  customer: Customer | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
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
    window.location.href = '/pelanggan';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
          <input
            {...register('phone', { required: true })}
            placeholder="081234567890"
            className={kelas}
          />
          <span className="mt-1 block text-xs text-muted">
            Disimpan dalam format 62… agar satu orang tidak tercatat dua kali.
          </span>
        </label>
        <label>
          <span className="mb-1 block text-sm font-semibold">Email (opsional)</span>
          <input type="email" {...register('email')} className={kelas} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Catatan internal</span>
        <textarea rows={3} {...register('notes')} className={kelas} />
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan pelanggan'}
      </button>
    </form>
  );
}
