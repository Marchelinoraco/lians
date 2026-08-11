'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { TravelRoute } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';

type Values = {
  origin: string;
  destination: string;
  price: number | '';
  isPublished: boolean;
  sortOrder: number;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function RouteForm({
  route,
  onSubmit,
}: {
  route: TravelRoute | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const [vehicleNote, setVehicleNote] = useState<Localized<string>>(
    route?.vehicleNote ?? { id: '' },
  );
  const [estimatedDuration, setEstimatedDuration] = useState<Localized<string>>(
    route?.estimatedDuration ?? { id: '' },
  );

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      origin: route?.origin ?? 'Manado',
      destination: route?.destination ?? '',
      price: route?.price ?? '',
      isPublished: route?.isPublished ?? true,
      sortOrder: route?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      price: v.price === '' ? null : Number(v.price),
      vehicleNote: vehicleNote.id?.trim() ? vehicleNote : null,
      estimatedDuration: estimatedDuration.id?.trim() ? estimatedDuration : null,
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    toast.success('Rute tersimpan.');
    window.location.href = '/rute';
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Asal</span>
          <input {...register('origin', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tujuan</span>
          <input {...register('destination', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif sekali jalan (Rp)</span>
          <input type="number" min={0} step={25000} {...register('price')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Kosongkan bila tarifnya belum ditetapkan — kartu rute akan menampilkan tombol
            &ldquo;Hubungi untuk harga&rdquo;.
          </span>
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
        label="Catatan kendaraan"
        values={vehicleNote}
        onChange={setVehicleNote}
        hint="Contoh: Avanza / Xenia. Boleh dikosongkan seluruhnya."
      />

      <LocalizedTextInput
        label="Perkiraan waktu tempuh"
        values={estimatedDuration}
        onChange={setEstimatedDuration}
        hint="Contoh: 45 menit / 45 minutes / 45 分钟 / 45분."
      />

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isPublished')} />
        Tampilkan di situs publik
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan rute'}
      </button>
    </form>
  );
}
