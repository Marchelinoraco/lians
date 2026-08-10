'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { signIn } from 'next-auth/react';

type Values = { email: string; password: string };

export function LoginForm() {
  const { register, handleSubmit } = useForm<Values>();
  const [galat, setGalat] = useState<string | null>(null);
  const [mengirim, setMengirim] = useState(false);

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    setGalat(null);

    const hasil = await signIn('credentials', { ...v, redirect: false });
    setMengirim(false);

    if (hasil?.error) {
      // Sengaja tidak membedakan "email tidak ada" dari "kata sandi salah":
      // membedakannya memberi tahu penebak mana email yang terdaftar.
      setGalat('Email atau kata sandi salah.');
      return;
    }
    window.location.href = '/';
  });

  return (
    <form onSubmit={kirim} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Email</span>
        <input
          type="email"
          autoComplete="username"
          {...register('email', { required: true })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Kata sandi</span>
        <input
          type="password"
          autoComplete="current-password"
          {...register('password', { required: true })}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
        />
      </label>

      {galat ? (
        <p role="alert" className="text-sm font-medium text-red-600">
          {galat}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={mengirim}
        className="w-full rounded-lg bg-lians-500 px-4 py-2.5 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Memproses…' : 'Masuk'}
      </button>
    </form>
  );
}
