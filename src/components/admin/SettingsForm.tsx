'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { SettingsInput } from '@/schemas/settings';
import type { ActionResult } from '@/actions/result';
import { LocalizedTextInput } from './LocalizedTextInput';
import { KELAS_ISIAN } from './kelas-form';

export function SettingsForm({
  settings,
  onSubmit,
}: {
  settings: SettingsInput;
  onSubmit: (input: unknown) => Promise<ActionResult<{ ok: true }>>;
}) {
  const [menyimpan, setMenyimpan] = useState(false);
  const [operatingHours, setOperatingHours] = useState(settings.operatingHours);
  const [heroTitle, setHeroTitle] = useState(settings.heroTitle);
  const [heroSubtitle, setHeroSubtitle] = useState(settings.heroSubtitle);
  const [promoBanner, setPromoBanner] = useState(settings.promoBanner);
  const [aboutText, setAboutText] = useState(settings.aboutText);

  const { register, handleSubmit } = useForm<SettingsInput>({ defaultValues: settings });

  const kirim = handleSubmit(async (v) => {
    setMenyimpan(true);
    const hasil = await onSubmit({
      ...v,
      socialLinks: settings.socialLinks,
      operatingHours,
      heroTitle,
      heroSubtitle,
      promoBanner,
      aboutText,
    });
    setMenyimpan(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([f, p]) =>
        toast.error(`${f}: ${p.join(', ')}`),
      );
      return;
    }
    toast.success('Pengaturan tersimpan. Situs publik ikut diperbarui.');
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Kontak</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
            <input {...register('whatsappNumber')} placeholder="081234567890" className={KELAS_ISIAN} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Telepon</span>
            <input {...register('phone')} className={KELAS_ISIAN} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Email</span>
            <input type="email" {...register('email')} className={KELAS_ISIAN} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Alamat</span>
          <textarea rows={2} {...register('address')} className={KELAS_ISIAN} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">URL peta Google (opsional)</span>
          <input {...register('mapsUrl')} className={KELAS_ISIAN} />
          <span className="mt-1 block text-xs text-muted">
            Kosongkan agar peta disusun otomatis dari alamat di atas.
          </span>
        </label>
      </section>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Teks halaman</h2>

        <LocalizedTextInput label="Jam operasional" values={operatingHours} onChange={setOperatingHours} />
        <LocalizedTextInput label="Judul hero" values={heroTitle} onChange={setHeroTitle} />
        <LocalizedTextInput
          label="Subjudul hero"
          values={heroSubtitle}
          onChange={setHeroSubtitle}
          multiline
          rows={2}
        />
        <LocalizedTextInput
          label="Banner promo"
          values={promoBanner}
          onChange={setPromoBanner}
          hint="Kosongkan seluruh bahasa untuk menyembunyikan banner."
        />
        <LocalizedTextInput
          label="Teks halaman Tentang"
          values={aboutText}
          onChange={setAboutText}
          multiline
          rows={8}
          hint="Pisahkan paragraf dengan satu baris kosong."
        />
      </section>

      <button
        type="submit"
        disabled={menyimpan}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {menyimpan ? 'Menyimpan…' : 'Simpan pengaturan'}
      </button>
    </form>
  );
}
