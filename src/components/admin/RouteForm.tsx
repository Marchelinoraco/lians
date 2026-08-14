'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { TravelRoute } from '@/db/schema';
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
  origin: string;
  destination: string;
  price: number | '';
  isPublished: boolean;
  sortOrder: number;
};

export function RouteForm({
  route,
  onSubmit,
}: {
  route: TravelRoute | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
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
    router.push('/rute');
  });

  return (
    <form onSubmit={kirim} className="max-w-2xl space-y-5 pb-2">
      <BagianForm judul="Rute travel">
        <div className="space-y-5">
      <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Asal</span>
          <input {...register('origin', { required: true })} className={KELAS_ISIAN} />
        </label>

        <label>
          <span className={KELAS_LABEL}>Tujuan</span>
          <input {...register('destination', { required: true })} className={KELAS_ISIAN} />
        </label>

        <label>
          <span className={KELAS_LABEL}>Tarif sekali jalan (Rp)</span>
          <input type="number" min={0} step={25000} {...register('price')} className={KELAS_ISIAN} />
          <span className={KELAS_BANTUAN}>
            Kosongkan bila tarifnya belum ditetapkan — kartu rute akan menampilkan tombol
            &ldquo;Hubungi untuk harga&rdquo;.
          </span>
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
        <input type="checkbox" {...register('isPublished')} className={KELAS_CENTANG} />
        Tampilkan di situs publik
      </label>

        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan rute'}
        </button>
        <Link href="/rute" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
