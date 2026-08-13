'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createTourRequest } from '@/actions/tour-request';
import { getMessages, fill, type Locale } from '@/i18n';

type Values = {
  customerName: string;
  phone: string;
  email: string;
  pax: number | '';
  startDate: string;
  endDate: string;
  notes: string;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function TourRequestForm({ tourSlug, locale }: { tourSlug: string; locale: Locale }) {
  const t = getMessages(locale);
  const [mengirim, setMengirim] = useState(false);
  const [berhasil, setBerhasil] = useState<{ code: string; url: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ defaultValues: { pax: 2 } });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await createTourRequest({ ...v, tourSlug });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.values(hasil.fieldErrors ?? {}).forEach((p) => toast.error(p.join(', ')));
      return;
    }

    setBerhasil({ code: hasil.data.requestCode, url: hasil.data.whatsappUrl });
    // Dibuka lewat klik, bukan otomatis: peramban memblokir jendela baru yang
    // terbit tanpa interaksi, dan tombolnya tetap ada bila blokir tetap terjadi.
    window.open(hasil.data.whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  if (berhasil) {
    return (
      <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <p className="font-bold text-emerald-900">{t.tourRequest.successTitle}</p>
        <p className="text-sm text-emerald-900">
          {fill(t.tourRequest.successBody, { code: berhasil.code })}
        </p>
        <a
          href={berhasil.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
        >
          {t.tourRequest.openWhatsApp}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={kirim} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="col-span-2">
          <span className="mb-1 block text-sm font-semibold">{t.tourRequest.pax}</span>
          <input
            type="number"
            min={1}
            max={60}
            {...register('pax', { required: true })}
            className={kelas}
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.tourRequest.startDate}</span>
          <input type="date" {...register('startDate', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.tourRequest.endDate}</span>
          <input type="date" {...register('endDate')} className={kelas} />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.tourRequest.name}</span>
        <input {...register('customerName', { required: true })} className={kelas} />
        {errors.customerName ? (
          <span className="mt-1 block text-xs text-red-600">{t.tourRequest.name}</span>
        ) : null}
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.tourRequest.phone}</span>
        <input {...register('phone', { required: true })} placeholder="081234567890" className={kelas} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.tourRequest.email}</span>
        <input type="email" {...register('email')} className={kelas} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{t.tourRequest.notes}</span>
        <textarea
          rows={3}
          {...register('notes')}
          placeholder={t.tourRequest.notesPlaceholder}
          className={kelas}
        />
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="w-full rounded-lg bg-lians-500 px-4 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? t.tourRequest.submitting : t.tourRequest.submit}
      </button>
    </form>
  );
}
