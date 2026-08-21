'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';
import { KELAS_ISIAN, KELAS_LABEL, KELAS_BANTUAN, KELAS_CENTANG, KELAS_TOMBOL_UTAMA } from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

type Values = { plate: string; vehicleId: string; notes: string; isActive: boolean };

export function FleetUnitForm({
  awal,
  model,
  onSubmit,
}: {
  awal: Partial<Values> | null;
  model: { id: string; name: string }[];
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit } = useForm<Values>({
    defaultValues: { plate: '', vehicleId: '', notes: '', isActive: true, ...awal },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit(v);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([, p]) => toast.error(p.join(', ')));
      return;
    }
    toast.success('Unit tersimpan.');
    router.push('/kendaraan-lians');
    router.refresh();
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-5 pb-2">
      <BagianForm judul="Kendaraan" keterangan="Satu baris untuk satu kendaraan fisik.">
        <div className="space-y-4">
          <KolomForm>
            <label>
              <span className={KELAS_LABEL}>Nomor polisi</span>
              <input
                {...register('plate', { required: true })}
                placeholder="B 2688 UOC"
                className={KELAS_ISIAN}
              />
              <span className={KELAS_BANTUAN}>
                Ditulis ulang seragam saat disimpan, jadi &quot;b2688uoc&quot; pun diterima.
              </span>
            </label>

            <label>
              <span className={KELAS_LABEL}>Model</span>
              <select {...register('vehicleId', { required: true })} className={KELAS_ISIAN}>
                <option value="">Pilih model…</option>
                {model.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <span className={KELAS_BANTUAN}>
                Menentukan unit ini muncul sebagai pilihan pada pesanan model yang mana.
              </span>
            </label>
          </KolomForm>

          <label className="block">
            <span className={KELAS_LABEL}>Catatan (opsional)</span>
            <textarea rows={2} {...register('notes')} className={KELAS_ISIAN} />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('isActive')} className={KELAS_CENTANG} />
            Masih dioperasikan
          </label>
          <p className={KELAS_BANTUAN}>
            Unit yang dijual atau lama di bengkel cukup dilepas centangnya — ia berhenti muncul
            sebagai pilihan, tetapi pesanan lama yang memakainya tetap terbaca.
          </p>
        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan unit'}
        </button>
        <Link href="/kendaraan-lians" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
