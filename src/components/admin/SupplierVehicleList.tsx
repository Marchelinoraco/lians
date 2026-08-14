'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import type { SupplierVehicle } from '@/db/schema';
import type { ActionResult } from '@/actions/result';
import { KELAS_ISIAN } from './kelas-form';

type Values = { name: string; notes: string };

export function SupplierVehicleList({
  supplierId,
  kendaraan,
  onAdd,
  onDelete,
}: {
  supplierId: string;
  kendaraan: SupplierVehicle[];
  onAdd: (input: unknown) => Promise<ActionResult<{ id: string }>>;
  onDelete: (id: string) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit, reset } = useForm<Values>();

  const tambah = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onAdd({ supplierId, name: v.name, notes: v.notes });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    reset();
    window.location.reload();
  });

  async function hapus(k: SupplierVehicle) {
    if (!window.confirm(`Hapus ${k.name} dari daftar kendaraan pemasok ini?`)) return;

    const hasil = await onDelete(k.id);
    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    window.location.reload();
  }

  return (
    <section className="max-w-2xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold">Kendaraan pemasok ({kendaraan.length})</h2>

      {kendaraan.length === 0 ? (
        <p className="text-sm text-muted">
          Belum ada kendaraan. Tambahkan agar bisa dipilih saat mencatat booking manual.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {kendaraan.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 py-3">
              <span>
                <span className="text-sm font-semibold">{k.name}</span>
                {k.notes ? <span className="block text-xs text-muted">{k.notes}</span> : null}
              </span>
              <button
                type="button"
                onClick={() => void hapus(k)}
                aria-label={`Hapus ${k.name}`}
                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={tambah} className="grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold">Nama kendaraan</span>
          <input
            {...register('name', { required: true })}
            placeholder="Avanza 2022"
            className={KELAS_ISIAN}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">Catatan (opsional)</span>
          <input
            {...register('notes')}
            placeholder="Plat DB 1234 XX"
            className={KELAS_ISIAN}
          />
        </label>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={mengirim}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden /> {mengirim ? 'Menambah…' : 'Tambah kendaraan'}
          </button>
        </div>
      </form>
    </section>
  );
}
