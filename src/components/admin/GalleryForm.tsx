'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { GalleryItem, VehicleImage } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';
import { ImageUploader } from './ImageUploader';
import { KELAS_ISIAN_DASAR } from './kelas-form';

type Values = { isPublished: boolean; sortOrder: number };

export function GalleryForm({
  item,
  onSubmit,
  onSelesai,
}: {
  item: GalleryItem | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
  /** Dipanggil setelah tersimpan, agar halaman pemanggil menyegarkan daftarnya. */
  onSelesai?: () => void;
}) {
  const [mengirim, setMengirim] = useState(false);
  const [image, setImage] = useState<VehicleImage[]>(item?.image ?? []);
  const [caption, setCaption] = useState<Localized<string>>(item?.caption ?? { id: '' });

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      isPublished: item?.isPublished ?? true,
      sortOrder: item?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({ ...v, image, caption });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.values(hasil.fieldErrors ?? {}).forEach((p) => toast.error(p.join(', ')));
      return;
    }

    toast.success('Foto tersimpan.');
    onSelesai?.();
    window.location.reload();
  });

  return (
    <form onSubmit={kirim} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <ImageUploader images={image} onChange={(next) => setImage(next.slice(0, 1))} />

      <LocalizedTextInput
        label="Keterangan foto (opsional)"
        values={caption}
        rows={2}
        onChange={setCaption}
      />

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register('isPublished')} />
          Tampilkan di situs
        </label>

        <label className="flex items-center gap-2 text-sm">
          Urutan
          <input
            type="number"
            min={0}
            {...register('sortOrder')}
            className={`w-24 ${KELAS_ISIAN_DASAR}`}
          />
          <span className="text-xs text-muted">angka kecil tampil lebih dulu</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : item ? 'Simpan perubahan' : 'Tambah foto'}
      </button>
    </form>
  );
}
