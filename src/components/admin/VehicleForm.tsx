'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Vehicle, VehicleImage } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { ImageUploader } from './ImageUploader';
import { LocalizedListInput } from './LocalizedListInput';

type Values = {
  name: string;
  category: Vehicle['category'];
  rate24h: number;
  rate12h: number | '';
  seats: number;
  transmission: Vehicle['transmission'];
  fuelType: Vehicle['fuelType'];
  year: number;
  luggage: number;
  status: Vehicle['status'];
  isPublished: boolean;
  sortOrder: number;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function VehicleForm({
  vehicle,
  onSubmit,
}: {
  vehicle: Vehicle | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [images, setImages] = useState<VehicleImage[]>(vehicle?.images ?? []);
  const [features, setFeatures] = useState<Localized<string[]>>(vehicle?.features ?? { id: [] });
  const [rentalTerms, setRentalTerms] = useState<Localized<string[]>>(
    vehicle?.rentalTerms ?? { id: [] },
  );
  const [serviceTypes, setServiceTypes] = useState<string[]>(
    vehicle?.serviceTypes ?? ['self-drive'],
  );
  const [mengirim, setMengirim] = useState(false);

  const { register, handleSubmit } = useForm<Values>({
    defaultValues: {
      name: vehicle?.name ?? '',
      category: vehicle?.category ?? 'mpv',
      rate24h: vehicle?.rate24h ?? 0,
      rate12h: vehicle?.rate12h ?? '',
      seats: vehicle?.seats ?? 7,
      transmission: vehicle?.transmission ?? 'manual',
      fuelType: vehicle?.fuelType ?? 'petrol',
      year: vehicle?.year ?? new Date().getFullYear(),
      luggage: vehicle?.luggage ?? 2,
      status: vehicle?.status ?? 'available',
      isPublished: vehicle?.isPublished ?? true,
      sortOrder: vehicle?.sortOrder ?? 0,
    },
  });

  const kirim = handleSubmit(async (v) => {
    if (serviceTypes.length === 0) {
      toast.error('Pilih minimal satu jenis layanan.');
      return;
    }
    if ((features.id?.length ?? 0) === 0) {
      toast.error('Fasilitas versi bahasa Indonesia wajib diisi minimal satu.');
      return;
    }

    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      rate12h: v.rate12h === '' ? null : Number(v.rate12h),
      images,
      features,
      rentalTerms,
      serviceTypes,
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([field, pesan]) =>
        toast.error(`${field}: ${pesan.join(', ')}`),
      );
      return;
    }

    toast.success('Kendaraan tersimpan.');
    window.location.href = '/armada';
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Nama kendaraan</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Kategori</span>
          <select {...register('category')} className={kelas}>
            <option value="hatchback">Hatchback</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="mpv">MPV</option>
            <option value="luxury">Mewah</option>
            <option value="bus">Bus / Hiace</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif 24 jam (Rp)</span>
          <input
            type="number"
            min={0}
            step={50000}
            {...register('rate24h', { valueAsNumber: true })}
            className={kelas}
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tarif 12 jam (Rp)</span>
          <input type="number" min={0} step={50000} {...register('rate12h')} className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Kosongkan bila tidak menyediakan paket 12 jam.
          </span>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Jumlah kursi</span>
          <input
            type="number"
            min={1}
            max={60}
            {...register('seats', { valueAsNumber: true })}
            className={kelas}
          />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Transmisi</span>
          <select {...register('transmission')} className={kelas}>
            <option value="manual">Manual</option>
            <option value="automatic">Matic</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Bahan bakar</span>
          <select {...register('fuelType')} className={kelas}>
            <option value="petrol">Bensin</option>
            <option value="diesel">Solar</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Listrik</option>
          </select>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tahun</span>
          <input type="number" {...register('year', { valueAsNumber: true })} className={kelas} />
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Kapasitas bagasi (koper)</span>
          <input
            type="number"
            min={0}
            {...register('luggage', { valueAsNumber: true })}
            className={kelas}
          />
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

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Jenis layanan</legend>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'self-drive', label: 'Lepas kunci' },
            { value: 'with-driver', label: 'Dengan sopir' },
            { value: 'tourism', label: 'Pariwisata' },
          ].map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={serviceTypes.includes(s.value)}
                onChange={(e) =>
                  setServiceTypes((prev) =>
                    e.target.checked ? [...prev, s.value] : prev.filter((x) => x !== s.value),
                  )
                }
              />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Status ketersediaan</span>
          <select {...register('status')} className={kelas}>
            <option value="available">Tersedia</option>
            <option value="unavailable">Sedang tersewa</option>
          </select>
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" {...register('isPublished')} />
          Tampilkan di situs publik
        </label>
      </div>

      <div>
        <span className="mb-2 block text-sm font-semibold">Foto kendaraan</span>
        <ImageUploader images={images} onChange={setImages} />
      </div>

      <LocalizedListInput
        label="Fasilitas"
        values={features}
        placeholder="AC Dingin"
        onChange={setFeatures}
      />

      <LocalizedListInput
        label="Syarat sewa"
        values={rentalTerms}
        placeholder="Jaminan KTP + KK"
        onChange={setRentalTerms}
      />

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan kendaraan'}
      </button>
    </form>
  );
}
