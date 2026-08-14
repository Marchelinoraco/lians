'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Testimonial } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';
import {
  KELAS_ISIAN,
  KELAS_LABEL,
  KELAS_BANTUAN,
  KELAS_CENTANG,
  KELAS_TOMBOL_UTAMA,
} from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

type Values = {
  customerName: string;
  rating: number;
  vehicleName: string;
  date: string;
  isFeatured: boolean;
  isPublished: boolean;
  sortOrder: number;
};

export function TestimonialForm({
  testimonial,
  onSubmit,
}: {
  testimonial: Testimonial | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
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
    router.push('/testimoni');
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-5 pb-2">
      <BagianForm judul="Ulasan">
        <div className="space-y-5">
      <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Nama pelanggan</span>
          <input {...register('customerName', { required: true })} className={KELAS_ISIAN} />
          <span className={KELAS_BANTUAN}>
            Nama orang tidak diterjemahkan.
          </span>
        </label>

        <label>
          <span className={KELAS_LABEL}>Rating</span>
          <select {...register('rating', { valueAsNumber: true })} className={KELAS_ISIAN}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} bintang
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={KELAS_LABEL}>Kendaraan yang disewa</span>
          <input {...register('vehicleName')} placeholder="Innova Reborn" className={KELAS_ISIAN} />
        </label>

        <label>
          <span className={KELAS_LABEL}>Tanggal</span>
          <input type="date" {...register('date', { required: true })} className={KELAS_ISIAN} />
        </label>

        <label>
          <span className={KELAS_LABEL}>Urutan tampil</span>
          <input
            type="number"
            {...register('sortOrder', { valueAsNumber: true })}
            className={KELAS_ISIAN}
          />
        </label>
      </KolomForm>

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
          <input type="checkbox" {...register('isFeatured')} className={KELAS_CENTANG} />
          Tampilkan di beranda
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isPublished')} className={KELAS_CENTANG} />
          Tampilkan di situs publik
        </label>
      </div>

        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan testimoni'}
        </button>
        <Link href="/testimoni" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
