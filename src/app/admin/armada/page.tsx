import Link from 'next/link';
import Image from 'next/image';
import { Plus, ImageOff } from 'lucide-react';
import { getAllVehicles } from '@/queries/vehicles';
import { formatRupiah } from '@/lib/format';
import { PencarianAdmin } from '@/components/admin/PencarianAdmin';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

/** Singkatan ditulis huruf besar; kapitalisasi otomatis menghasilkan "Mpv". */
const LABEL_KATEGORI: Record<string, string> = {
  hatchback: 'Hatchback',
  sedan: 'Sedan',
  suv: 'SUV',
  mpv: 'MPV',
  luxury: 'Luxury',
  bus: 'Bus / Hiace',
};

export default async function ArmadaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage();
  const { q } = await searchParams;
  const semua = await getAllVehicles();

  const cari = q?.trim().toLowerCase();
  const armada = cari
    ? semua.filter((v) =>
        [v.name, v.category, v.slug].some((teks) => teks.toLowerCase().includes(cari)),
      )
    : semua;

  const tanpaFoto = armada.filter((v) => v.images.length === 0).length;
  const tanpaPelayanan = armada.filter((v) => v.ratePelayanan === null).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Armada</h1>
          {tanpaFoto > 0 || tanpaPelayanan > 0 ? (
            <p className="mt-1 text-sm text-muted">
              {tanpaFoto > 0 ? `${tanpaFoto} kendaraan belum ada fotonya` : null}
              {tanpaFoto > 0 && tanpaPelayanan > 0 ? ' · ' : null}
              {tanpaPelayanan > 0 ? `${tanpaPelayanan} belum diisi tarif Pelayanan` : null}
            </p>
          ) : null}
        </div>
        <Link
          href="/armada/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah kendaraan
        </Link>
      </div>

      <PencarianAdmin
        nilai={q}
        placeholder="Cari nama atau kategori…"
        aksi="/armada"
        jumlah={armada.length}
      />

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-muted">
            <tr>
              <th className="p-4">Kendaraan</th>
              <th className="p-4">Kategori</th>
              <th className="p-4">Lepas kunci</th>
              <th className="p-4">Pelayanan</th>
              <th className="p-4">Status</th>
              <th className="p-4">Tayang</th>
            </tr>
          </thead>
          <tbody>
            {armada.map((v) => {
              const foto = v.images[0];

              return (
                <tr key={v.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  {/* Foto disatukan dengan nama: tabel armada tanpa gambar sulit
                      dipindai, dan kolom angka "0 foto" tidak memberi tahu
                      kendaraan mana yang sebenarnya kosong. */}
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {foto ? (
                          <Image
                            src={foto.url}
                            alt=""
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                        ) : (
                          <span className="grid h-full w-full place-items-center">
                            <ImageOff className="h-4 w-4 text-slate-300" aria-hidden />
                          </span>
                        )}
                      </div>

                      <span>
                        <Link href={`/armada/${v.id}`} className="font-semibold text-lians-700">
                          {v.name}
                        </Link>
                        {v.images.length === 0 ? (
                          <span className="block text-xs text-amber-700">Belum ada foto</span>
                        ) : (
                          <span className="block text-xs text-muted">{v.images.length} foto</span>
                        )}
                      </span>
                    </div>
                  </td>

                  <td className="p-4">{LABEL_KATEGORI[v.category] ?? v.category}</td>

                  <td className="p-4 tabular-nums">
                    {v.rateLepasKunci === null ? (
                      <span className="text-slate-300">—</span>
                    ) : (
                      formatRupiah(v.rateLepasKunci)
                    )}
                  </td>

                  <td className="p-4 tabular-nums">
                    {v.ratePelayanan === null ? (
                      <span className="text-amber-700">Belum diisi</span>
                    ) : (
                      formatRupiah(v.ratePelayanan)
                    )}
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        v.status === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {v.status === 'available' ? 'Tersedia' : 'Tersewa'}
                    </span>
                  </td>

                  <td className="p-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        v.isPublished ? 'bg-lians-50 text-lians-700' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {v.isPublished ? 'Tayang' : 'Disembunyikan'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {armada.length === 0 ? (
          <p className="p-12 text-center text-muted">Belum ada kendaraan.</p>
        ) : null}
      </div>
    </div>
  );
}
