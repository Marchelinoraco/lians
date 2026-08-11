'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Testimonial } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';

type Values = {
  customerName: string;
  rating: number;
  vehicleName: string;
  date: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function TestimonialForm({
  testimonial,
  onSubmit,
}: {
  testimonial: Testimonial | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const [reviewText, setReviewText] = useState<Localized<string>>(
    testimonial?.reviewText ?? { id: '' },
  );

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      customerName: testimonial?.customerName ?? '',
      rating: testimonial?.rating ?? 5,
      vehicleName: testimonial?.vehicleName ?? '',
      date: testimonial?.date ?? new Date().toISOString().slice(0, 10),
      isFeatured: testimonial?.isFeatured ?? false,
      isPublished: testimonial?.isPublished ?? true,
      sortOrder: testimonial?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      vehicleName: v.vehicleName.trim() || null,
      reviewText,
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    toast.success('Testimoni tersimpan.');
    window.location.href = '/testimoni';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama pelanggan</span>
          <input {...register('customerName', { required: true })} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Nama orang tidak diterjemahkan.
          </span>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Rating</span>
          <select {...register('rating', { valueAsNumber: true })} className={kelas}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} bintang
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Kendaraan yang disewa</span>
          <input {...register('vehicleName')} placeholder="Innova Reborn" className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tanggal</span>
          <input type="date" {...register('date', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Urutan tampil</span>
          <input
            type="number"
            {...register('sortOrder', { valueAsNumber: true })}
            className={kelas}
          />
        </label>
      </div>

      <LocalizedTextInput
        label="Isi ulasan"
        values={reviewText}
        onChange={setReviewText}
        multiline
        rows={4}
        hint="Minimal 10 karakter untuk versi Indonesia. Maksimum 500 karakter per bahasa."
      />

      <div className="space-y-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isFeatured')} />
          Tampilkan di beranda
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isPublished')} />
          Tampilkan di situs publik
        </label>
      </div>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan testimoni'}
      </button>
    </form>
  );
}
