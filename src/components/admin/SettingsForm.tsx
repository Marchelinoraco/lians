'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { SettingsInput } from '@/schemas/settings';
import type { ActionResult } from '@/actions/result';
import { LocalizedTextInput } from './LocalizedTextInput';
import { KELAS_ISIAN, KELAS_LABEL, KELAS_BANTUAN, KELAS_TOMBOL_UTAMA } from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

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
    <form onSubmit={kirim} className="max-w-3xl space-y-5 pb-2">
      <BagianForm
        judul="Kontak"
        keterangan="Dipakai di seluruh situs — tombol WhatsApp, footer, dan halaman kontak."
      >
        <div className="space-y-4">
        <KolomForm>
          <label>
            <span className={KELAS_LABEL}>Nomor WhatsApp</span>
            <input {...register('whatsappNumber')} placeholder="081234567890" className={KELAS_ISIAN} />
          </label>
          <label>
            <span className={KELAS_LABEL}>Telepon</span>
            <input {...register('phone')} className={KELAS_ISIAN} />
          </label>
          <label>
            <span className={KELAS_LABEL}>Email</span>
            <input type="email" {...register('email')} className={KELAS_ISIAN} />
          </label>
        </KolomForm>

        <label className="block">
          <span className={KELAS_LABEL}>Alamat</span>
          <textarea rows={2} {...register('address')} className={KELAS_ISIAN} />
        </label>

        <label className="block">
          <span className={KELAS_LABEL}>URL peta Google (opsional)</span>
          <input {...register('mapsUrl')} className={KELAS_ISIAN} />
          <span className={KELAS_BANTUAN}>
            Kosongkan agar peta disusun otomatis dari alamat di atas.
          </span>
        </label>
        </div>
      </BagianForm>

      <BagianForm
        judul="Teks halaman"
        keterangan="Bahasa Indonesia wajib; bahasa lain yang kosong akan memakai versi Indonesia."
      >
        <div className="space-y-5">

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
        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={menyimpan} className={KELAS_TOMBOL_UTAMA}>
          {menyimpan ? 'Menyimpan…' : 'Simpan pengaturan'}
        </button>
      </AksiForm>
    </form>
  );
}
