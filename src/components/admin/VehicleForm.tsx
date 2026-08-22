'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Vehicle, VehicleImage } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { ImageUploader } from './ImageUploader';
import { LocalizedListInput } from './LocalizedListInput';
import { KELAS_ISIAN, KELAS_LABEL, KELAS_BANTUAN, KELAS_CENTANG, KELAS_TOMBOL_UTAMA } from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';
import { LABEL_LAYANAN } from '@/lib/label-layanan';

type Values = {
  name: string;
  category: Vehicle['category'];
  rateLepasKunci: number | '';
  ratePelayanan: number | '';
  seats: number;
  transmission: Vehicle['transmission'];
  fuelType: Vehicle['fuelType'];
  year: number;
  luggage: number;
  status: Vehicle['status'];
  isPublished: boolean;
  sortOrder: number;
};

export function VehicleForm({
  vehicle,
  onSubmit,
}: {
  vehicle: Vehicle | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const router = useRouter();
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
      rateLepasKunci: vehicle?.rateLepasKunci ?? '',
      ratePelayanan: vehicle?.ratePelayanan ?? '',
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
    if (v.rateLepasKunci === '' && v.ratePelayanan === '') {
      toast.error('Isi minimal satu tarif: lepas kunci atau pelayanan.');
      return;
    }

    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      rateLepasKunci: v.rateLepasKunci === '' ? null : Number(v.rateLepasKunci),
      ratePelayanan: v.ratePelayanan === '' ? null : Number(v.ratePelayanan),
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
    router.push('/armada');
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-5 pb-2">
      <BagianForm
        judul="Identitas dan tarif"
        keterangan="Tarif dipakai apa adanya di situs; kategori yang tarifnya kosong tidak ditawarkan."
      >
        <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Nama kendaraan</span>
          <input {...register('name', { required: true })} className={KELAS_ISIAN} />
        </label>

        <label>
          <span className={KELAS_LABEL}>Kategori</span>
          <select {...register('category')} className={KELAS_ISIAN}>
            <option value="hatchback">Hatchback</option>
            <option value="sedan">Sedan</option>
            <option value="suv">SUV</option>
            <option value="mpv">MPV</option>
            <option value="luxury">Mewah</option>
            <option value="bus">Bus / Hiace</option>
          </select>
        </label>

        <label>
          <span className={KELAS_LABEL}>Tarif lepas kunci / hari (Rp)</span>
          <input
            type="number"
            min={0}
            step={50000}
            {...register('rateLepasKunci')}
            className={KELAS_ISIAN}
          />
          <span className={KELAS_BANTUAN}>
            Kendaraan saja. Kosongkan bila tidak dilepas-kunci — kategori ini lalu tidak muncul di
            situs.
          </span>
        </label>

        <label>
          <span className={KELAS_LABEL}>Tarif pelayanan / hari (Rp)</span>
          <input
            type="number"
            min={0}
            step={50000}
            {...register('ratePelayanan')}
            className={KELAS_ISIAN}
          />
          <span className={KELAS_BANTUAN}>
            Sudah termasuk pengemudi dan BBM. Kosongkan bila tidak ditawarkan.
          </span>
        </label>

        </KolomForm>
      </BagianForm>

      <BagianForm judul="Spesifikasi kendaraan">
        <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Jumlah kursi</span>
          <input
            type="number"
            min={1}
            max={60}
            {...register('seats', { valueAsNumber: true })}
            className={KELAS_ISIAN}
          />
        </label>

        <label>
          <span className={KELAS_LABEL}>Transmisi</span>
          <select {...register('transmission')} className={KELAS_ISIAN}>
            <option value="manual">Manual</option>
            <option value="automatic">Matic</option>
          </select>
        </label>

        <label>
          <span className={KELAS_LABEL}>Bahan bakar</span>
          <select {...register('fuelType')} className={KELAS_ISIAN}>
            <option value="petrol">Bensin</option>
            <option value="diesel">Solar</option>
            <option value="hybrid">Hybrid</option>
            <option value="electric">Listrik</option>
          </select>
        </label>

        <label>
          <span className={KELAS_LABEL}>Tahun</span>
          <input type="number" {...register('year', { valueAsNumber: true })} className={KELAS_ISIAN} />
        </label>

        <label>
          <span className={KELAS_LABEL}>Kapasitas bagasi (koper)</span>
          <input
            type="number"
            min={0}
            {...register('luggage', { valueAsNumber: true })}
            className={KELAS_ISIAN}
          />
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
      </BagianForm>

      <BagianForm
        judul="Layanan dan penayangan"
        keterangan="Menentukan di halaman mana kendaraan ini muncul, dan apakah muncul sama sekali."
      >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Jenis layanan</legend>
        <div className="flex flex-wrap gap-4">
          {[
            { value: 'self-drive', label: LABEL_LAYANAN['self-drive'] },
            { value: 'with-driver', label: LABEL_LAYANAN['with-driver'] },
            // Pariwisata tetap ditawarkan di sini meski tidak lagi muncul saat
            // mencatat pesanan: tiga bus dan Hiace memang menawarkannya di
            // katalog publik, dan itu tidak ikut dihapus.
            { value: 'tourism', label: LABEL_LAYANAN.tourism },
          ].map((s) => (
            <label key={s.value} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={KELAS_CENTANG}
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

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label>
          <span className={KELAS_LABEL}>Status ketersediaan</span>
          <select {...register('status')} className={KELAS_ISIAN}>
            <option value="available">Tersedia</option>
            <option value="unavailable">Sedang tersewa</option>
          </select>
        </label>

        <label className="flex items-end gap-2 pb-2 text-sm">
          <input type="checkbox" {...register('isPublished')} className={KELAS_CENTANG} />
          Tampilkan di situs publik
        </label>
      </div>
      </BagianForm>

      <BagianForm
        judul="Foto"
        keterangan="Foto pertama dipakai sebagai gambar utama di daftar armada."
      >
        <ImageUploader images={images} onChange={setImages} />
      </BagianForm>

      <BagianForm judul="Fasilitas dan syarat sewa">
        <div className="space-y-6">
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
        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan kendaraan'}
        </button>
        <Link href="/armada" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
