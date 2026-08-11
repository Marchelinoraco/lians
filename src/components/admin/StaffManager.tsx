'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import type { ActionResult } from '@/actions/result';

type Staf = { id: string; name: string; email: string };
type Values = { name: string; email: string; password: string };

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function StaffManager({
  staf,
  emailSaya,
  onCreate,
  onDelete,
}: {
  staf: Staf[];
  emailSaya: string;
  onCreate: (input: unknown) => Promise<ActionResult<{ id: string }>>;
  onDelete: (id: string) => Promise<ActionResult<{ id: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit, reset } = useForm<Values>();

  const tambah = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onCreate(v);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([f, p]) =>
        toast.error(`${f}: ${p.join(', ')}`),
      );
      return;
    }
    toast.success('Akun staf dibuat.');
    reset();
    window.location.reload();
  });

  async function hapus(s: Staf) {
    if (!window.confirm(`Hapus akun ${s.email}?`)) return;
    const hasil = await onDelete(s.id);
    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    toast.success('Akun dihapus.');
    window.location.reload();
  }

  return (
    <section className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="font-bold">Akun staf</h2>

      <ul className="divide-y divide-slate-100">
        {staf.map((s) => (
          <li key={s.id} className="flex items-center justify-between gap-3 py-3">
            <div>
              <p className="text-sm font-semibold">{s.name}</p>
              <p className="text-xs text-muted">{s.email}</p>
            </div>
            {s.email === emailSaya ? (
              <span className="text-xs text-muted">akun Anda</span>
            ) : (
              <button
                type="button"
                onClick={() => void hapus(s)}
                aria-label={`Hapus akun ${s.email}`}
                className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={tambah} className="grid gap-3 border-t border-slate-200 pt-5 sm:grid-cols-3">
        <label>
          <span className="mb-1 block text-xs font-semibold">Nama</span>
          <input {...register('name', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">Email</span>
          <input type="email" {...register('email', { required: true })} className={kelas} />
        </label>
        <label>
          <span className="mb-1 block text-xs font-semibold">Kata sandi</span>
          <input
            type="password"
            autoComplete="new-password"
            {...register('password', { required: true })}
            className={kelas}
          />
        </label>

        <div className="sm:col-span-3">
          <p className="mb-3 text-xs text-muted">
            Kata sandi minimal 10 karakter. Tidak bisa dilihat kembali setelah disimpan — catat dan
            berikan langsung ke staf yang bersangkutan.
          </p>
          <button
            type="submit"
            disabled={mengirim}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400 disabled:opacity-50"
          >
            {mengirim ? 'Membuat…' : 'Tambah akun staf'}
          </button>
        </div>
      </form>
    </section>
  );
}
