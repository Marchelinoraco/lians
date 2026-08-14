'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { Post, VehicleImage } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import type { Localized } from '@/i18n/localized';
import { LocalizedTextInput } from './LocalizedTextInput';
import { LocalizedListInput } from './LocalizedListInput';
import { ImageUploader } from './ImageUploader';
import { KELAS_ISIAN, KELAS_LABEL, KELAS_BANTUAN, KELAS_CENTANG, KELAS_TOMBOL_UTAMA } from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

type Values = {
  slug: string;
  publishedAt: string;
  isPublished: boolean;
};

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
  const router = useRouter();
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
    router.push('/blog');
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-5 pb-2">
      <BagianForm judul="Judul dan alamat">
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

      <div className="mt-5">
        <KolomForm>
        <label>
          <span className={KELAS_LABEL}>Slug (alamat artikel)</span>
          <input {...register('slug', { required: true })} placeholder="tips-sewa-mobil" className={KELAS_ISIAN} />
          <span className={KELAS_BANTUAN}>
            Tampil di alamat: lians.id/blog/<em>slug</em>. Hindari mengubahnya setelah artikel
            tayang — tautan lama akan mati.
          </span>
        </label>

        <label>
          <span className={KELAS_LABEL}>Tanggal terbit</span>
          <input type="date" {...register('publishedAt', { required: true })} className={KELAS_ISIAN} />
        </label>
        </KolomForm>
      </div>
      </BagianForm>

      <BagianForm judul="Isi artikel">
      <LocalizedTextInput
        label="Ringkasan (tampil di daftar artikel dan hasil pencarian)"
        values={excerpt}
        rows={3}
        onChange={setExcerpt}
      />

      <div className="mt-6">
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

      </BagianForm>

      <BagianForm judul="Foto sampul" keterangan="Opsional, satu foto saja.">
        <ImageUploader images={coverImage} onChange={(next) => setCoverImage(next.slice(0, 1))} />
      </BagianForm>

      <BagianForm judul="Penerbitan">
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register('isPublished')} className={`mt-0.5 ${KELAS_CENTANG}`} />
          <span>
            Terbitkan artikel ini
            <span className="block text-xs text-muted">
              Selama tidak dicentang, hanya Anda yang bisa melihatnya.
            </span>
          </span>
        </label>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : 'Simpan artikel'}
        </button>
        <Link href="/blog" className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}
