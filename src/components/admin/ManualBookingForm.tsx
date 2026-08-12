'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';

export type PilihanKendaraanPemasok = { id: string; name: string; supplierName: string };
export type PilihanPelanggan = { id: string; name: string; phone: string; email: string | null };
export type PilihanArmada = { id: string; name: string };

type Values = {
  customerName: string;
  phone: string;
  email: string;
  serviceType: 'self-drive' | 'with-driver' | 'tourism' | 'travel';
  itemName: string;
  startDate: string;
  endDate: string;
  totalPrice: number | '';
  asalKendaraan: 'sendiri' | 'pemasok';
  vehicleId: string;
  supplierVehicleId: string;
  supplierCost: number | '';
  supplierPaid: boolean;
  notes: string;
  adminNotes: string;
};

const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

export function ManualBookingForm({
  armada,
  kendaraanPemasok,
  pelanggan,
  onSubmit,
}: {
  armada: PilihanArmada[];
  kendaraanPemasok: PilihanKendaraanPemasok[];
  pelanggan: PilihanPelanggan[];
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string; bookingCode: string }>>;
}) {
  const [mengirim, setMengirim] = useState(false);
  const { register, handleSubmit, watch, setValue, getValues } = useForm<Values>({
    defaultValues: {
      serviceType: 'with-driver',
      asalKendaraan: 'sendiri',
      vehicleId: '',
      supplierPaid: false,
      totalPrice: '',
      supplierCost: '',
    },
  });

  const nilai = watch();
  const dariPemasok = nilai.asalKendaraan === 'pemasok';

  /** Mengisi nama dan email otomatis bila nomornya sudah ada di daftar pelanggan. */
  function cocokkanPelanggan(nomor: string) {
    const bersih = nomor.replace(/\D/g, '');
    if (bersih.length < 8) return;

    // Dicocokkan lewat sembilan angka terakhir supaya 0811… dan +62811… sama,
    // tanpa perlu menormalkan di sisi klien.
    const ketemu = pelanggan.find((p) => p.phone.endsWith(bersih.slice(-9)));
    if (!ketemu) return;

    setValue('customerName', ketemu.name);
    if (ketemu.email) setValue('email', ketemu.email);
    toast.info(`Pelanggan dikenali: ${ketemu.name}`);
  }

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);
    const hasil = await onSubmit({
      ...v,
      totalPrice: v.totalPrice === '' ? 0 : Number(v.totalPrice),
      supplierCost: v.supplierCost === '' ? '' : Number(v.supplierCost),
    });
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      Object.entries(hasil.fieldErrors ?? {}).forEach(([, p]) => toast.error(p.join(', ')));
      return;
    }

    toast.success(`Pesanan ${hasil.data.bookingCode} tercatat.`);
    window.location.href = `/booking/${hasil.data.id}`;
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-6">
      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Pelanggan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold">Nomor WhatsApp</span>
            <input
              {...register('phone', { required: true })}
              onBlur={(e) => cocokkanPelanggan(e.target.value)}
              placeholder="081234567890"
              className={kelas}
            />
            <span className="mt-1 block text-xs text-muted">
              Bila nomor ini sudah pernah memesan, nama akan terisi sendiri.
            </span>
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Nama</span>
            <input {...register('customerName', { required: true })} className={kelas} />
          </label>
          <label>
            <span className="mb-1 block text-sm font-semibold">Email (opsional)</span>
            <input type="email" {...register('email')} className={kelas} />
          </label>
        </div>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Pesanan</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className="mb-1 block text-sm font-semibold">Jenis layanan</span>
            <select {...register('serviceType')} className={kelas}>
              <option value="self-drive">Lepas kunci</option>
              <option value="with-driver">Dengan sopir</option>
              <option value="tourism">Bus / Hiace pariwisata</option>
              <option value="travel">Antar-jemput / travel</option>
            </select>
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Keterangan pesanan</span>
            <input
              {...register('itemName', { required: true })}
              placeholder="Innova Zenix + sopir, 3 hari"
              className={kelas}
            />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Tanggal mulai</span>
            <input type="date" {...register('startDate', { required: true })} className={kelas} />
          </label>

          <label>
            <span className="mb-1 block text-sm font-semibold">Tanggal selesai (opsional)</span>
            <input type="date" {...register('endDate')} className={kelas} />
          </label>
        </div>

        <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">
          Tanggal di sini hanya keterangan untuk rekap internal. Harga tidak dihitung darinya — Anda
          yang menentukan totalnya.
        </p>

        <label className="block max-w-xs">
          <span className="mb-1 block text-sm font-semibold">Total harga ke pelanggan (Rp)</span>
          <input
            type="number"
            min={0}
            step={50000}
            {...register('totalPrice', { required: true })}
            className={kelas}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Kendaraan</h2>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Asal kendaraan</legend>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="sendiri" {...register('asalKendaraan')} /> Milik LIANS
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" value="pemasok" {...register('asalKendaraan')} /> Dari pemasok
            </label>
          </div>
        </fieldset>

        {dariPemasok ? null : (
          <label className="block max-w-sm">
            <span className="mb-1 block text-sm font-semibold">Unit armada (opsional)</span>
            <select
              {...register('vehicleId')}
              onChange={(e) => {
                setValue('vehicleId', e.target.value);
                const unit = armada.find((a) => a.id === e.target.value);
                // Hanya mengisi keterangan yang masih kosong: admin yang sudah
                // menulis "paket 3 hari harga negosiasi" tidak boleh kehilangan
                // kalimatnya hanya karena memilih unit.
                if (unit && !getValues('itemName')) setValue('itemName', unit.name);
              }}
              className={kelas}
            >
              <option value="">Tidak terkait unit tertentu</option>
              {armada.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-muted">
              Menautkan pesanan ke armada LIANS untuk keperluan rekap. Keterangan pesanan di atas
              tetap yang tampil.
            </span>
          </label>
        )}

        {dariPemasok ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="mb-1 block text-sm font-semibold">Kendaraan pemasok</span>
              <select {...register('supplierVehicleId')} className={kelas}>
                <option value="">Pilih kendaraan…</option>
                {kendaraanPemasok.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.supplierName} — {k.name}
                  </option>
                ))}
              </select>
              {kendaraanPemasok.length === 0 ? (
                <span className="mt-1 block text-xs text-amber-700">
                  Belum ada kendaraan pemasok. Tambahkan lebih dulu di menu Pemasok.
                </span>
              ) : null}
            </label>

            <label>
              <span className="mb-1 block text-sm font-semibold">Biaya ke pemasok (Rp)</span>
              <input
                type="number"
                min={0}
                step={50000}
                {...register('supplierCost')}
                className={kelas}
              />
              <span className="mt-1 block text-xs text-muted">
                Total untuk pesanan ini, bukan per hari. Selisihnya dengan harga pelanggan adalah
                margin Anda.
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...register('supplierPaid')} />
              Sudah dibayar ke pemasok
            </label>
          </div>
        ) : null}
      </section>

      <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold">Catatan</h2>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Catatan dari pelanggan</span>
          <textarea rows={2} {...register('notes')} className={kelas} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Catatan internal</span>
          <textarea rows={2} {...register('adminNotes')} className={kelas} />
        </label>
      </section>

      <button
        type="submit"
        disabled={mengirim}
        className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
      >
        {mengirim ? 'Menyimpan…' : 'Simpan pesanan'}
      </button>
    </form>
  );
}
