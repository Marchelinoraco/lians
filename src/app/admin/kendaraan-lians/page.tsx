import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getFleetUnits } from '@/queries/fleet-units';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function KendaraanLiansPage() {
  await requireAdminPage();
  const unit = await getFleetUnits();

  // Dikelompokkan per model, bukan dideret rata: yang ingin diketahui admin
  // adalah "berapa bus yang kita punya", dan daftar lurus sepanjang lima belas
  // baris memaksa mereka menghitungnya sendiri.
  const perModel = new Map<string, typeof unit>();
  for (const u of unit) {
    perModel.set(u.vehicleName, [...(perModel.get(u.vehicleName) ?? []), u]);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black">Kendaraan LIANS</h1>
          <p className="mt-1 text-sm text-muted">
            Kendaraan milik sendiri, satu baris per nomor polisi. Dipakai untuk memperingatkan
            bila satu unit dipesan dua kali di tanggal yang sama.
          </p>
        </div>
        <Link
          href="/kendaraan-lians/baru"
          className="flex items-center gap-1.5 rounded-lg bg-lians-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lians-600"
        >
          <Plus className="h-4 w-4" aria-hidden /> Tambah unit
        </Link>
      </div>

      {unit.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-muted">
          Belum ada kendaraan terdaftar.
        </p>
      ) : (
        <div className="space-y-6">
          {[...perModel.entries()].map(([model, daftar]) => (
            <section key={model} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-3 flex items-baseline justify-between gap-3">
                <h2 className="font-bold">{model}</h2>
                <span className="text-sm text-muted">{daftar.length} unit</span>
              </div>
              <ul className="divide-y divide-slate-100">
                {daftar.map((u) => (
                  <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                    <div>
                      <Link
                        href={`/kendaraan-lians/${u.id}`}
                        className="font-semibold text-lians-600 hover:underline"
                      >
                        {u.plate}
                      </Link>
                      {u.notes ? <p className="text-xs text-muted">{u.notes}</p> : null}
                    </div>
                    {u.isActive ? null : (
                      <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                        Tidak dioperasikan
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
