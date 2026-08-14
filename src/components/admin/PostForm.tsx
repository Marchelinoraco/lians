'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Post, VehicleImage } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';
import { LocalizedListInput } from './LocalizedListInput';
import { ImageUploader } from './ImageUploader';

type Values = {
  slug: string;
  publishedAt: string;
  isPublished: boolean;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

/** Mengubah judul menjadi slug: huruf kecil, tanda hubung, tanpa aksen. */
function jadikanSlug(teks: string): string {
  return teks
    .toLowerCase()
    .normalize('NFD')
    // Ditulis sebagai escape Unicode, bukan karakter mentah: tanda diakritik
    // tidak terlihat di editor dan mudah rusak saat berkas disunting.
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

export function PostForm({
  post,
  onSubmit,
}: {
  post: Post | null;
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const [title, setTitle] = useState<Localized<string>>(post?.title ?? { id: '' });
  const [excerpt, setExcerpt] = useState<Localized<string>>(post?.excerpt ?? { id: '' });
  const [body, setBody] = useState<Localized<string[]>>(post?.body ?? { id: [] });
  const [coverImage, setCoverImage] = useState<VehicleImage[]>(post?.coverImage ?? []);

  const { register, handleSubmit, setValue, getValues } = useForm<Values>({
    defaultValues: {
      slug: post?.slug ?? '',
      publishedAt: post?.publishedAt ?? new Date().toISOString().slice(0, 10),
      isPublished: post?.isPublished ?? false,
    },
  });

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({ ...v, title, excerpt, body, coverImage });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.values(hasil.fieldErrors ?? {}).forEach((p) => toast.error(p.join(', ')));
      return;
    }

    toast.success('Artikel tersimpan.');
    window.location.href = '/blog';
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-6">
      <LocalizedTextInput
        label="Judul artikel"
        values={title}
        rows={2}
        onChange={(next) => {
          setTitle(next);
          // Slug diisikan dari judul hanya selama masih kosong. Mengubahnya
          // otomatis pada artikel yang sudah tayang akan memutus tautan lama
          // dan membuang peringkat pencariannya.
          if (!getValues('slug') && next.id) setValue('slug', jadikanSlug(next.id));
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-sm font-semibold">Slug (alamat artikel)</span>
          <input {...register('slug', { required: true })} placeholder="tips-sewa-mobil" className={kelas} />
          <span className="mt-1 block text-xs text-muted">
            Tampil di alamat: lians.id/blog/<em>slug</em>. Hindari mengubahnya setelah artikel
            tayang — tautan lama akan mati.
          </span>
        </label>

        <label>
          <span className="mb-1 block text-sm font-semibold">Tanggal terbit</span>
          <input type="date" {...register('publishedAt', { required: true })} className={kelas} />
        </label>
      </div>

      <LocalizedTextInput
        label="Ringkasan (tampil di daftar artikel dan hasil pencarian)"
        values={excerpt}
        rows={3}
        onChange={setExcerpt}
      />

      <div>
        <LocalizedListInput
          label="Isi artikel — satu baris satu paragraf"
          placeholder="Tulis satu paragraf, lalu Enter untuk paragraf berikutnya"
          values={body}
          onChange={setBody}
        />
        <div className="mt-2 rounded-lg bg-slate-50 p-3 text-xs text-muted">
          <p className="mb-1 font-semibold text-slate-700">Dua tanda yang dikenali:</p>
          <p>
            Awali baris dengan <code className="rounded bg-white px-1">## </code> untuk subjudul,
            atau <code className="rounded bg-white px-1">- </code> untuk butir daftar. Selain itu
            ditulis apa adanya — tidak ada format lain, dan teks Anda tidak akan berubah bentuk
            sendiri.
          </p>
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Foto sampul (opsional, satu saja)</p>
        <ImageUploader images={coverImage} onChange={(next) => setCoverImage(next.slice(0, 1))} />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" {...register('isPublished')} />
        Terbitkan artikel ini
        <span className="text-xs text-muted">— selama tidak dicentang, hanya Anda yang bisa melihatnya</span>
      </label>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan artikel'}
      </button>
    </form>
  );
}
