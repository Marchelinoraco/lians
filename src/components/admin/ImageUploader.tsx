'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { getUploadSignature } from '@/actions/upload';
import type { VehicleImage } from '@/db/schema';

export function ImageUploader({
  images,
  onChange,
}: {
  images: VehicleImage[];
  onChange: (next: VehicleImage[]) => void;
}) {
  const [mengunggah, setMengunggah] = useState(false);

  async function unggah(files: FileList | null) {
    if (!files || files.length === 0) return;
    setMengunggah(true);

    const tanda = await getUploadSignature();
    if (!tanda.ok) {
      toast.error(tanda.message);
      setMengunggah(false);
      return;
    }

    const terunggah: VehicleImage[] = [];

    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', tanda.data.apiKey);
      form.append('timestamp', String(tanda.data.timestamp));
      form.append('signature', tanda.data.signature);
      form.append('folder', tanda.data.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${tanda.data.cloudName}/image/upload`,
        { method: 'POST', body: form },
      );

      // Satu foto gagal tidak membatalkan sisanya — kegagalan unggah
      // juga tidak boleh membatalkan penyimpanan kendaraan.
      if (!res.ok) {
        toast.error(`Gagal mengunggah ${file.name}. Foto lain tetap diproses.`);
        continue;
      }

      const json = (await res.json()) as { secure_url: string; public_id: string };
      terunggah.push({ url: json.secure_url, publicId: json.public_id, alt: '' });
    }

    onChange([...images, ...terunggah]);
    setMengunggah(false);
    if (terunggah.length > 0) toast.success(`${terunggah.length} foto terunggah.`);
  }

  return (
    <div className="space-y-3">
      <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm font-semibold hover:border-lians-400">
        <Upload className="h-4 w-4" aria-hidden />
        {mengunggah ? 'Mengunggah…' : 'Tambah foto'}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={mengunggah}
          onChange={(e) => void unggah(e.target.files)}
          className="sr-only"
        />
      </label>

      {images.length > 0 ? (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.publicId} className="relative">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                <Image
                  src={img.url}
                  alt={img.alt || 'Foto kendaraan'}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
              {i === 0 ? (
                <span className="absolute left-1 top-1 rounded bg-lians-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  Utama
                </span>
              ) : null}
              <button
                type="button"
                aria-label={`Hapus foto ${i + 1}`}
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-white/90 p-1 text-red-600 hover:bg-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted">
          Foto pertama menjadi gambar utama di katalog. Kendaraan tetap bisa disimpan tanpa foto.
        </p>
      )}
    </div>
  );
}
