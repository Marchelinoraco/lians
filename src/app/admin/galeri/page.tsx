import Image from 'next/image';
import { getAllGallery } from '@/queries/gallery';
import { GalleryForm } from '@/components/admin/GalleryForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { createGalleryItem, updateGalleryItem, deleteGalleryItem } from '@/actions/admin-gallery';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function GaleriPage() {
  await requireAdminPage();
  const daftar = await getAllGallery();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black">Galeri</h1>
        <p className="mt-1 text-sm text-muted">
          Foto di sini tampil di halaman Testimoni. Selama galeri kosong, bagian itu tidak muncul
          sama sekali di situs.
        </p>
      </div>

      <section className="max-w-2xl space-y-3">
        <h2 className="font-bold">Tambah foto</h2>
        <GalleryForm item={null} onSubmit={createGalleryItem} />
      </section>

      <section className="space-y-4">
        <h2 className="font-bold">Foto tersimpan ({daftar.length})</h2>

        {daftar.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
            Belum ada foto.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {daftar.map((item) => {
              const foto = item.image[0];

              async function simpan(input: unknown) {
                'use server';
                return updateGalleryItem(item.id, input);
              }

              async function hapus() {
                'use server';
                return deleteGalleryItem(item.id);
              }

              return (
                <li
                  key={item.id}
                  className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                    {foto ? (
                      <Image
                        src={foto.url}
                        alt={foto.alt || 'Foto galeri'}
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover"
                      />
                    ) : null}

                    {!item.isPublished ? (
                      <span className="absolute left-2 top-2 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        Disembunyikan
                      </span>
                    ) : null}
                  </div>

                  <p className="text-sm">{item.caption.id || <span className="text-muted">Tanpa keterangan</span>}</p>
                  <p className="text-xs text-muted">Urutan {item.sortOrder}</p>

                  <details className="text-sm">
                    <summary className="cursor-pointer font-semibold text-lians-700">Ubah</summary>
                    <div className="mt-3">
                      <GalleryForm item={item} onSubmit={simpan} />
                    </div>
                  </details>

                  <DeleteButton
                    onDelete={hapus}
                    redirectTo="/galeri"
                    konfirmasi="Hapus foto ini dari galeri?"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
