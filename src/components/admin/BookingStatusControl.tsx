'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';
import { KELAS_ISIAN } from './kelas-form';

const STATUS = [
  { value: 'pending', label: 'Menunggu konfirmasi' },
  { value: 'confirmed', label: 'Dikonfirmasi' },
  { value: 'completed', label: 'Selesai' },
  { value: 'cancelled', label: 'Dibatalkan' },
];

export function BookingStatusControl({
  status,
  catatan,
  onStatus,
  onNotes,
}: {
  status: string;
  catatan: string;
  onStatus: (status: string) => Promise<ActionResult<{ id: string }>>;
  onNotes: (catatan: string) => Promise<ActionResult<{ id: string }>>;
}) {
  const [nilai, setNilai] = useState(status);
  const [teks, setTeks] = useState(catatan);
  const [sibuk, setSibuk] = useState(false);

  async function ubahStatus(baru: string) {
    const sebelum = nilai;
    setNilai(baru);
    setSibuk(true);

    const hasil = await onStatus(baru);
    setSibuk(false);

    if (!hasil.ok) {
      // Kembalikan ke nilai lama supaya layar tidak berbohong soal apa yang tersimpan.
      setNilai(sebelum);
      toast.error(hasil.message);
      return;
    }
    toast.success('Status diperbarui.');
  }

  async function simpanCatatan() {
    setSibuk(true);
    const hasil = await onNotes(teks);
    setSibuk(false);
    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    toast.success('Catatan tersimpan.');
  }

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Status pesanan</span>
        <select
          value={nilai}
          disabled={sibuk}
          onChange={(e) => void ubahStatus(e.target.value)}
          className={KELAS_ISIAN}
        >
          {STATUS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Catatan internal</span>
        <textarea
          rows={4}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          placeholder="Sudah ditelepon, minta dijemput jam 8…"
          className={KELAS_ISIAN}
        />
        <span className="mt-1 block text-xs text-muted">
          Hanya terlihat oleh staf, tidak pernah tampil di situs publik.
        </span>
      </label>

      <button
        type="button"
        onClick={() => void simpanCatatan()}
        disabled={sibuk}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400 disabled:opacity-50"
      >
        Simpan catatan
      </button>
    </div>
  );
}
