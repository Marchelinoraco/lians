'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';
import { MASKAPAI } from '@/data/maskapai';
import {
  KELAS_ISIAN,
  KELAS_LABEL,
  KELAS_BANTUAN,
  KELAS_TOMBOL_UTAMA,
} from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';
import { PilihPelanggan, type PilihanPelanggan } from './PilihPelanggan';

type Values = {
  customerName: string;
  phone: string;
  email: string;
  origin: string;
  destination: string;
  airline: string;
  departureDate: string;
  returnDate: string;
  pax: number | '';
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string;
  adminNotes: string;
};

export function ManualTicketRequestForm({
  pelanggan,
  onSubmit,
}: {
  pelanggan: PilihanPelanggan[];
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string; requestCode: string }>>;
}) {
  const router = useRouter();
  const [mengirim, setMengirim] = useState(false);

  const { register, handleSubmit, setValue } = useForm<Values>({
    defaultValues: {
      // Hampir semua tiket yang dipesankan berangkat dari Manado; mengisinya
      // di awal menghemat satu isian pada mayoritas pencatatan, dan tetap
      // bisa diganti.
      origin: 'Manado',
      airline: '',
      pax: 1,
      status: 'pending',
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({ ...v, pax: v.pax === '' ? 0 : Number(v.pax) });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.values(hasil.fieldErrors ?? {}).forEach((p) => toast.error(p.join(', ')));
      return;
    }

    toast.success(`Permintaan ${hasil.data.requestCode} tercatat.`);
    router.push(`/permintaan-tiket/${hasil.data.id}`);
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-5 pb-2">
      <BagianForm
        judul="Pelanggan"
        keterangan="Isi nomor lebih dulu — data pelanggan lama akan terpanggil sendiri."
      >
        <div className="space-y-4">
          <KolomForm>
            <PilihPelanggan
              pelanggan={pelanggan}
              onKetemu={(p) => {
                setValue('customerName', p.name);
                if (p.email) setValue('email', p.email);
              }}
              daftar={register('phone', { required: true })}
            />
            <label>
              <span className={KELAS_LABEL}>Nama</span>
              <input {...register('customerName', { required: true })} className={KELAS_ISIAN} />
            </label>
            <label>
              <span className={KELAS_LABEL}>Email (opsional)</span>
              <input type="email" {...register('email')} className={KELAS_ISIAN} />
            </label>
          </KolomForm>
        </div>
      </BagianForm>

      <BagianForm judul="Penerbangan">
        <div className="space-y-4">
          <KolomForm>
            <label>
              <span className={KELAS_LABEL}>Kota asal</span>
              <input {...register('origin', { required: true })} className={KELAS_ISIAN} />
            </label>
            <label>
              <span className={KELAS_LABEL}>Kota tujuan</span>
              <input
                {...register('destination', { required: true })}
                placeholder="Jakarta"
                className={KELAS_ISIAN}
              />
            </label>
            <label>
              <span className={KELAS_LABEL}>Maskapai (opsional)</span>
              <select {...register('airline')} className={KELAS_ISIAN}>
                <option value="">Belum menentukan</option>
                {MASKAPAI.map((m) => (
                  <option key={m.kode} value={m.kode}>
                    {m.nama}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={KELAS_LABEL}>Jumlah penumpang</span>
              <input
                type="number"
                min={1}
                max={50}
                {...register('pax', { valueAsNumber: true, required: true })}
                className={KELAS_ISIAN}
              />
            </label>
            <label>
              <span className={KELAS_LABEL}>Tanggal berangkat</span>
              <input
                type="date"
                {...register('departureDate', { required: true })}
                className={KELAS_ISIAN}
              />
            </label>
            <label>
              <span className={KELAS_LABEL}>Tanggal kembali (opsional)</span>
              <input type="date" {...register('returnDate')} className={KELAS_ISIAN} />
              <span className={KELAS_BANTUAN}>Kosongkan untuk sekali jalan.</span>
            </label>
          </KolomForm>

          <label className="block max-w-xs">
            <span className={KELAS_LABEL}>Status</span>
            <select {...register('status')} className={KELAS_ISIAN}>
              <option value="pending">Menunggu</option>
              <option value="confirmed">Dikonfirmasi</option>
              <option value="completed">Selesai</option>
              <option value="cancelled">Dibatalkan</option>
            </select>
          </label>
        </div>
      </BagianForm>

      <BagianForm judul="Catatan">
        <div className="space-y-4">
          <label className="block">
            <span className={KELAS_LABEL}>Catatan dari pelanggan</span>
            <textarea rows={2} {...register('notes')} className={KELAS_ISIAN} />
          </label>
          <label className="block">
            <span className={KELAS_LABEL}>Catatan internal</span>
            <textarea rows={2} {...register('adminNotes')} className={KELAS_ISIAN} />
            <span className={KELAS_BANTUAN}>Tidak pernah dilihat pelanggan.</span>
          </label>
        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan permintaan'}
        </button>
        <Link
          href="/permintaan-tiket"
          className="text-sm font-semibold text-muted hover:text-lians-600"
        >
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
