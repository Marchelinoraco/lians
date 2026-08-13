'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { createTicketRequest } from '@/actions/ticket-request';
import { MASKAPAI } from '@/data/maskapai';
import { getMessages, fill, type Locale } from '@/i18n';

type Values = {
  origin: string;
  destination: string;
  airline: string;
  departureDate: string;
  returnDate: string;
  pax: number | '';
  customerName: string;
  phone: string;
  email: string;
  notes: string;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function TicketRequestForm({ locale }: { locale: Locale }) {
  const t = getMessages(locale);
  const [mengirim, setMengirim] = useState(false);
  const [berhasil, setBerhasil] = useState<{ code: string; url: string } | null>(null);

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: { pax: 1, airline: '' },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await createTicketRequest(v);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.values(hasil.fieldErrors ?? {}).forEach((p) => toast.error(p.join(', ')));
      return;
    }

    setBerhasil({ code: hasil.data.requestCode, url: hasil.data.whatsappUrl });
    window.open(hasil.data.whatsappUrl, '_blank', 'noopener,noreferrer');
  });

  if (berhasil) {
    return (
      <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="font-bold text-emerald-900">{t.ticket.successTitle}</p>
        <p className="text-sm text-emerald-900">
          {fill(t.ticket.successBody, { code: berhasil.code })}
        </p>
        <a
          href={berhasil.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
        >
          {t.ticket.openWhatsApp}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={kirim} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.origin}</span>
          <input
            {...register('origin', { required: true })}
            placeholder={t.ticket.originPlaceholder}
            className={kelas}
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.destination}</span>
          <input
            {...register('destination', { required: true })}
            placeholder={t.ticket.destinationPlaceholder}
            className={kelas}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">{t.ticket.airline}</span>
          <select {...register('airline')} className={kelas}>
            {/* Pilihan pertama sengaja "belum menentukan": itu jawaban paling
                jujur bagi kebanyakan orang, dan justru yang paling perlu dibantu. */}
            <option value="">{t.ticket.airlineAny}</option>
            {MASKAPAI.map((m) => (
              <option key={m.kode} value={m.kode}>
                {m.nama}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.departureDate}</span>
          <input type="date" {...register('departureDate', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.returnDate}</span>
          <input type="date" {...register('returnDate')} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.pax}</span>
          <input
            type="number"
            min={1}
            max={50}
            {...register('pax', { required: true })}
            className={kelas}
          />
        </label>
      </div>

      <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.name}</span>
          <input {...register('customerName', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">{t.ticket.phone}</span>
          <input
            {...register('phone', { required: true })}
            placeholder="081234567890"
            className={kelas}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">{t.ticket.email}</span>
          <input type="email" {...register('email')} className={kelas} />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-1 block text-sm font-semibold">{t.ticket.notes}</span>
          <textarea
            rows={3}
            {...register('notes')}
            placeholder={t.ticket.notesPlaceholder}
            className={kelas}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={mengirim}
        className="w-full rounded-lg bg-lians-500 px-4 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {mengirim ? t.ticket.submitting : t.ticket.submit}
      </button>
    </form>
  );
}
