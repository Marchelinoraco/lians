'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';
import { hitungBiayaOperasional, hitungMargin } from '@/lib/biaya';
import { formatRupiah, formatRupiahBertanda } from '@/lib/format';
import {
  KELAS_ISIAN,
  KELAS_LABEL,
  KELAS_BANTUAN,
  KELAS_CENTANG,
  KELAS_TOMBOL_UTAMA,
} from './kelas-form';
import { BagianForm, KolomForm, AksiForm } from './BagianForm';

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
  costFuel: number | '';
  costDriver: number | '';
  costTollParking: number | '';
  costOther: number | '';
  costOtherNote: string;
  notes: string;
  adminNotes: string;
};

/** Kolom angka yang dikosongkan dikirim sebagai string kosong, bukan nol. */
const n = (v: number | '' | undefined): number | null => (v === '' || v === undefined ? null : Number(v));

/**
 * Satu form untuk dua keperluan: mencatat pesanan baru dan mengubah pesanan
 * yang sudah ada.
 *
 * Isiannya identik sampai ke aturan validasinya, jadi menyalinnya menjadi dua
 * komponen berarti setiap penambahan kolom harus diketik dua kali — dan yang
 * terlewat baru ketahuan sebagai isian yang diam-diam hilang saat mengubah.
 */
export function ManualBookingForm({
  armada,
  kendaraanPemasok,
  pelanggan,
  onSubmit,
  mode = 'buat',
  awal,
  batalKe = '/booking',
}: {
  armada: PilihanArmada[];
  kendaraanPemasok: PilihanKendaraanPemasok[];
  pelanggan: PilihanPelanggan[];
  onSubmit: (input: unknown) => Promise<ActionResult<{ id: string; bookingCode?: string }>>;
  mode?: 'buat' | 'ubah';
  awal?: Partial<Values>;
  batalKe?: string;
}) {
  const router = useRouter();
  const [mengirim, setMengirim] = useState(false);
  const mengubah = mode === 'ubah';
  const { register, handleSubmit, watch, setValue, getValues } = useForm<Values>({
    defaultValues: {
      serviceType: 'with-driver',
      asalKendaraan: 'sendiri',
      vehicleId: '',
      supplierPaid: false,
      totalPrice: '',
      supplierCost: '',
      costFuel: '',
      costDriver: '',
      costTollParking: '',
      costOther: '',
      ...awal,
    },
  });

  const nilai = watch();
  const dariPemasok = nilai.asalKendaraan === 'pemasok';

  // Dihitung dengan fungsi yang sama seperti halaman detail, rekap, dan
  // ekspor: angka di layar saat mengetik harus persis angka yang tersimpan.
  const posBiaya = {
    costFuel: n(nilai.costFuel),
    costDriver: n(nilai.costDriver),
    costTollParking: n(nilai.costTollParking),
    costOther: n(nilai.costOther),
  };
  const biayaOperasional = hitungBiayaOperasional(posBiaya);
  const biayaPemasok = dariPemasok ? n(nilai.supplierCost) : null;
  const margin = hitungMargin({ ...posBiaya, totalPrice: n(nilai.totalPrice), supplierCost: biayaPemasok });

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

    toast.success(
      mengubah ? 'Perubahan tersimpan.' : `Pesanan ${hasil.data.bookingCode} tercatat.`,
    );
    router.push(`/booking/${hasil.data.id}`);
  });

  return (
    <form onSubmit={kirim} className="max-w-3xl space-y-5 pb-2">
      <BagianForm judul="Pelanggan" keterangan="Isi nomor lebih dulu — data pelanggan lama akan terpanggil sendiri.">
        <div className="space-y-4">
        <KolomForm>
          <label>
            <span className={KELAS_LABEL}>Nomor WhatsApp</span>
            <input
              {...register('phone', { required: true })}
              onBlur={(e) => cocokkanPelanggan(e.target.value)}
              placeholder="081234567890"
              className={KELAS_ISIAN}
            />
            <span className={KELAS_BANTUAN}>
              Bila nomor ini sudah pernah memesan, nama akan terisi sendiri.
            </span>
          </label>
          <label>
            <span className={KELAS_LABEL}>Nama</span>
            <input {...register('customerName', { required: true })} className={KELAS_ISIAN} />
          </label>
          <label>
            <span className={KELAS_LABEL}>Email (opsional)</span>
            <input type="email" {...register('email')} className={KELAS_ISIAN} />
          </label>
        </KolomForm>
        </div>
      </BagianForm>

      <BagianForm judul="Pesanan">
        <div className="space-y-4">
        <KolomForm>
          <label>
            <span className={KELAS_LABEL}>Jenis layanan</span>
            <select {...register('serviceType')} className={KELAS_ISIAN}>
              <option value="self-drive">Lepas kunci</option>
              <option value="with-driver">Dengan sopir</option>
              <option value="tourism">Bus / Hiace pariwisata</option>
              <option value="travel">Antar-jemput / travel</option>
            </select>
          </label>

          <label>
            <span className={KELAS_LABEL}>Keterangan pesanan</span>
            <input
              {...register('itemName', { required: true })}
              placeholder="Innova Zenix + sopir, 3 hari"
              className={KELAS_ISIAN}
            />
          </label>

          <label>
            <span className={KELAS_LABEL}>Tanggal mulai</span>
            <input type="date" {...register('startDate', { required: true })} className={KELAS_ISIAN} />
          </label>

          <label>
            <span className={KELAS_LABEL}>Tanggal selesai (opsional)</span>
            <input type="date" {...register('endDate')} className={KELAS_ISIAN} />
          </label>
        </KolomForm>

        <p className="rounded-lg bg-slate-50 p-3 text-xs text-muted">
          Tanggal di sini hanya keterangan untuk rekap internal. Harga tidak dihitung darinya — Anda
          yang menentukan totalnya.
        </p>

        <label className="block max-w-xs">
          <span className={KELAS_LABEL}>Total harga ke pelanggan (Rp)</span>
          <input
            type="number"
            min={0}
            step={50000}
            {...register('totalPrice', { required: true })}
            className={KELAS_ISIAN}
          />
        </label>
        </div>
      </BagianForm>

      <BagianForm judul="Kendaraan">
        <div className="space-y-4">

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
            <span className={KELAS_LABEL}>Unit armada (opsional)</span>
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
              className={KELAS_ISIAN}
            >
              <option value="">Tidak terkait unit tertentu</option>
              {armada.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className={KELAS_BANTUAN}>
              Menautkan pesanan ke armada LIANS untuk keperluan rekap. Keterangan pesanan di atas
              tetap yang tampil.
            </span>
          </label>
        )}

        {dariPemasok ? (
          <KolomForm>
            <label>
              <span className={KELAS_LABEL}>Kendaraan pemasok</span>
              <select {...register('supplierVehicleId')} className={KELAS_ISIAN}>
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
              <span className={KELAS_LABEL}>Biaya ke pemasok (Rp)</span>
              <input
                type="number"
                min={0}
                step={50000}
                {...register('supplierCost')}
                className={KELAS_ISIAN}
              />
              <span className={KELAS_BANTUAN}>
                Total untuk pesanan ini, bukan per hari. Selisihnya dengan harga pelanggan adalah
                margin Anda.
              </span>
            </label>

            <label className="flex items-center gap-2 text-sm sm:col-span-2">
              <input type="checkbox" {...register('supplierPaid')} className={KELAS_CENTANG} />
              Sudah dibayar ke pemasok
            </label>
          </KolomForm>
        ) : null}
        </div>
      </BagianForm>

      <BagianForm
        judul="Biaya operasional"
        keterangan="Uang yang keluar dari kantong LIANS untuk menjalankan pesanan ini."
      >
        <div className="space-y-4">
          {dariPemasok ? (
            <p className="rounded-lg bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">
              Kendaraannya memang dari pemasok, tetapi biaya di bawah ini tetap tanggungan LIANS —
              terpisah dari biaya sewa yang dibayarkan ke pemasok.
            </p>
          ) : null}

          <KolomForm>
            <label>
              <span className={KELAS_LABEL}>BBM (Rp)</span>
              <input type="number" min={0} step={50000} {...register('costFuel')} className={KELAS_ISIAN} />
            </label>

            <label>
              <span className={KELAS_LABEL}>Biaya sopir (Rp)</span>
              <input type="number" min={0} step={50000} {...register('costDriver')} className={KELAS_ISIAN} />
              <span className={KELAS_BANTUAN}>
                Upah sopir untuk pesanan ini, termasuk uang makan.
              </span>
            </label>

            <label>
              <span className={KELAS_LABEL}>Tol &amp; parkir (Rp)</span>
              <input type="number" min={0} step={10000} {...register('costTollParking')} className={KELAS_ISIAN} />
            </label>

            <label>
              <span className={KELAS_LABEL}>Lain-lain (Rp)</span>
              <input type="number" min={0} step={10000} {...register('costOther')} className={KELAS_ISIAN} />
            </label>

            <label className="sm:col-span-2">
              <span className={KELAS_LABEL}>Keterangan biaya lain-lain</span>
              <input
                {...register('costOtherNote')}
                placeholder="Cuci mobil, parkir inap"
                className={KELAS_ISIAN}
              />
            </label>
          </KolomForm>

          <RingkasanMargin
            total={n(nilai.totalPrice)}
            biayaPemasok={biayaPemasok}
            biayaOperasional={biayaOperasional}
            margin={margin}
          />
        </div>
      </BagianForm>

      <BagianForm judul="Catatan">
        <div className="space-y-4">
        <label className="block">
          <span className={KELAS_LABEL}>Catatan dari pelanggan</span>
          <textarea rows={2} {...register('notes')} className={KELAS_ISIAN} />
        </label>
        <label className="block">
          <span className={KELAS_LABEL}>Catatan internal</span>
          <textarea rows={2} {...register('adminNotes')} className={KELAS_ISIAN} />
        </label>
        </div>
      </BagianForm>

      <AksiForm>
        <button type="submit" disabled={mengirim} className={KELAS_TOMBOL_UTAMA}>
          {mengirim ? 'Menyimpan…' : mengubah ? 'Simpan perubahan' : 'Simpan pesanan'}
        </button>
        <Link href={batalKe} className="text-sm font-semibold text-muted hover:text-lians-600">
          Batal
        </Link>
      </AksiForm>
    </form>
  );
}

/**
 * Rincian margin yang berubah mengikuti ketikan.
 *
 * Angkanya sengaja diperlihatkan saat mengisi, bukan hanya setelah disimpan:
 * pesanan yang ternyata merugi paling murah diperbaiki sebelum harganya
 * telanjur disepakati lewat telepon.
 */
function RingkasanMargin({
  total,
  biayaPemasok,
  biayaOperasional,
  margin,
}: {
  total: number | null;
  biayaPemasok: number | null;
  biayaOperasional: number;
  margin: number | null;
}) {
  const merugi = margin !== null && margin < 0;

  return (
    <dl className="rounded-lg bg-slate-50 p-4 text-sm">
      <div className="flex justify-between">
        <dt>Total ke pelanggan</dt>
        <dd>{total === null ? '—' : formatRupiah(total)}</dd>
      </div>
      {biayaPemasok !== null ? (
        <div className="mt-1 flex justify-between text-muted">
          <dt>Biaya ke pemasok</dt>
          <dd>− {formatRupiah(biayaPemasok)}</dd>
        </div>
      ) : null}
      <div className="mt-1 flex justify-between text-muted">
        <dt>Biaya operasional</dt>
        <dd>− {formatRupiah(biayaOperasional)}</dd>
      </div>
      <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold">
        <dt>Margin</dt>
        <dd
          data-testid="margin"
          className={merugi ? 'text-red-600' : 'text-lians-700'}
        >
          {margin === null ? '—' : formatRupiahBertanda(margin)}
        </dd>
      </div>
      {merugi ? (
        <p className="mt-2 text-xs text-red-600">
          Biaya melampaui harga ke pelanggan. Pesanan ini merugi.
        </p>
      ) : null}
    </dl>
  );
}
