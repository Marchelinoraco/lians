'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';

type Values = { passwordLama: string; passwordBaru: string; ulangi: string };

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function PasswordForm({
  onSubmit,
}: {
  onSubmit: (input: unknown) => Promise<ActionResult<{ ok: true }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit, watch, reset } = useForm<Values>();

  const baru = watch('passwordBaru') ?? '';
  const ulangi = watch('ulangi') ?? '';
  const tidakCocok = ulangi.length > 0 && baru !== ulangi;

  const kirim = handleSubmit(async (v) => {
    if (v.passwordBaru !== v.ulangi) {
      toast.error('Ulangi kata sandi tidak sama.');
      return;
    }

    setMengirim(true);
    const hasil = await onSubmit({
      passwordLama: v.passwordLama,
      passwordBaru: v.passwordBaru,
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([, p]) => toast.error(p.join(', ')));
      return;
    }

    reset();
    toast.success('Kata sandi diganti. Pakai yang baru saat login berikutnya.');
  });

  return (
    <section className="max-w-3xl space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <h2 className="font-bold">Ganti kata sandi saya</h2>
        <p className="mt-1 text-xs text-muted">
          Minimal 10 karakter. Sesi Anda tetap aktif setelah diganti.
        </p>
      </div>

      <form onSubmit={kirim} className="grid gap-3 sm:grid-cols-3">
        <label>
          <span className="mb-1 block text-xs font-semibold">Kata sandi saat ini</span>
          <input
            type="password"
            autoComplete="current-password"
            {...register('passwordLama', { required: true })}
            className={kelas}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold">Kata sandi baru</span>
          <input
            type="password"
            autoComplete="new-password"
            {...register('passwordBaru', { required: true })}
            className={kelas}
          />
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold">Ulangi kata sandi baru</span>
          <input
            type="password"
            autoComplete="new-password"
            {...register('ulangi', { required: true })}
            className={kelas}
          />
          {tidakCocok ? (
            <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
              Belum sama dengan kata sandi baru.
            </span>
          ) : null}
        </label>

        <div className="sm:col-span-3">
          <button
            type="submit"
            disabled={mengirim || tidakCocok}
            className="rounded-lg bg-lians-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
          >
            {mengirim ? 'Menyimpan…' : 'Ganti kata sandi'}
          </button>
        </div>
      </form>
    </section>
  );
}
