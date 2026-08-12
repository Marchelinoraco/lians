'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { calculateRentalPrice, type PriceBreakdown, type RateCategory } from '@/lib/pricing';
import { formatRupiah } from '@/lib/format';
import { cn } from '@/lib/cn';
import { getMessages, fill, localeHref, type Locale } from '@/i18n';
import type { ActionResult } from '@/actions/result';
import { PriceSummary } from './PriceSummary';

export type BookingVehicleOption = {
  id: string;
  slug: string;
  name: string;
  rateLepasKunci: number | null;
  ratePelayanan: number | null;
  status: 'available' | 'unavailable';
};

export type BookingRouteOption = { id: string; label: string; price: number | null };

type FormValues = {
  serviceType: 'self-drive' | 'with-driver' | 'tourism' | 'travel';
  vehicleId: string;
  routeId: string;
  startDate: string;
  endDate: string;
  rateCategory: RateCategory;
  customerName: string;
  phone: string;
  email: string;
  notes: string;
};

type SubmitFn = (
  input: unknown,
) => Promise<ActionResult<{ bookingCode: string; whatsappUrl: string }>>;

const kelasInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lians-500 focus:outline-none focus:ring-2 focus:ring-lians-200';

export function BookingForm({
  vehicles,
  routes,
  defaultVehicleSlug,
  defaultRouteId,
  onSubmit,
  locale,
}: {
  vehicles: BookingVehicleOption[];
  routes: BookingRouteOption[];
  defaultVehicleSlug: string | null;
  defaultRouteId: string | null;
  onSubmit: SubmitFn;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const [mengirim, setMengirim] = useState(false);

  const bawaan = vehicles.find((v) => v.slug === defaultVehicleSlug) ?? null;

  const { register, watch, handleSubmit, setValue } = useForm<FormValues>({
    defaultValues: {
      serviceType: defaultRouteId ? 'travel' : 'self-drive',
      vehicleId: bawaan?.id ?? '',
      routeId: defaultRouteId ?? '',
      startDate: '',
      endDate: '',
      // Kendaraan yang tidak dilepas-kunci harus langsung memilih pelayanan,
      // supaya form tidak terbuka dengan kategori yang tidak tersedia.
      rateCategory: bawaan && bawaan.rateLepasKunci === null ? 'pelayanan' : 'lepas-kunci',
      customerName: '',
      phone: '',
      email: '',
      notes: '',
    },
  });

  const nilai = watch();
  const adalahTravel = nilai.serviceType === 'travel';
  const kendaraanTerpilih = vehicles.find((v) => v.id === nilai.vehicleId) ?? null;
  const rutePilihan = routes.find((r) => r.id === nilai.routeId) ?? null;

  const punyaLepasKunci = kendaraanTerpilih?.rateLepasKunci !== null;
  const punyaPelayanan = kendaraanTerpilih?.ratePelayanan !== null;

  // Bila kategori terpilih tidak disediakan kendaraan yang baru dipilih,
  // pindahkan ke kategori yang tersedia agar perkiraan harga tidak macet.
  const kategoriAktif: RateCategory =
    nilai.rateCategory === 'lepas-kunci' && !punyaLepasKunci
      ? 'pelayanan'
      : nilai.rateCategory === 'pelayanan' && !punyaPelayanan
        ? 'lepas-kunci'
        : nilai.rateCategory;

  const { breakdown, pesanHarga } = useMemo((): {
    breakdown: PriceBreakdown | null;
    pesanHarga?: string;
  } => {
    if (adalahTravel) {
      return {
        breakdown: null,
        pesanHarga: rutePilihan
          ? rutePilihan.price === null
            ? t.booking.routeNoPrice
            : fill(t.booking.routeFixedPrice, { harga: formatRupiah(rutePilihan.price) })
          : undefined,
      };
    }
    if (!kendaraanTerpilih || !nilai.startDate || !nilai.endDate) return { breakdown: null };

    const hasil = calculateRentalPrice({
      vehicle: {
        rateLepasKunci: kendaraanTerpilih.rateLepasKunci,
        ratePelayanan: kendaraanTerpilih.ratePelayanan,
      },
      startDate: new Date(nilai.startDate),
      endDate: new Date(nilai.endDate),
      category: kategoriAktif,
    });

    if (hasil.ok) return { breakdown: hasil.breakdown };
    return { breakdown: null, pesanHarga: t.pricingError[hasil.error] };
  }, [adalahTravel, rutePilihan, kendaraanTerpilih, nilai.startDate, nilai.endDate, kategoriAktif, t]);

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);

    const payload = adalahTravel
      ? {
          serviceType: 'travel',
          routeId: v.routeId,
          startDate: v.startDate,
          customerName: v.customerName,
          phone: v.phone,
          email: v.email,
          notes: v.notes,
        }
      : {
          serviceType: v.serviceType,
          vehicleId: v.vehicleId,
          startDate: v.startDate,
          endDate: v.endDate,
          rateCategory: kategoriAktif,
          customerName: v.customerName,
          phone: v.phone,
          email: v.email,
          notes: v.notes,
        };

    const hasil = await onSubmit(payload);
    setMengirim(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }

    window.location.href = localeHref(
      `/booking/sukses?kode=${hasil.data.bookingCode}&wa=${encodeURIComponent(hasil.data.whatsappUrl)}`,
      locale,
    );
  });

  const kartuKategori = (
    kategori: RateCategory,
    judul: string,
    catatan: string,
    tarif: number,
  ) => (
    <label
      className={cn(
        'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
        kategoriAktif === kategori
          ? 'border-lians-500 bg-lians-50'
          : 'border-slate-300 hover:border-lians-300',
      )}
    >
      <input
        type="radio"
        value={kategori}
        checked={kategoriAktif === kategori}
        onChange={() => setValue('rateCategory', kategori)}
        className="mt-1"
      />
      <span>
        <span className="block font-semibold">{judul}</span>
        <span className="block text-xs text-muted">{catatan}</span>
        <span className="mt-1 block font-bold text-lians-600">
          {formatRupiah(tarif)}{' '}
          <span className="text-xs font-medium text-muted">{t.common.perHari}</span>
        </span>
      </span>
    </label>
  );

  return (
    <form onSubmit={kirim} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.serviceType}</span>
          <select {...register('serviceType')} className={kelasInput}>
            <option value="self-drive">{t.booking.selfDrive}</option>
            <option value="with-driver">{t.booking.withDriver}</option>
            <option value="tourism">{t.booking.tourism}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.vehicle}</span>
          <select {...register('vehicleId', { required: true })} className={kelasInput}>
            <option value="">{t.booking.chooseVehicle}</option>
            {vehicles.map((v) => (
              <option key={v.id} value={v.id} disabled={v.status !== 'available'}>
                {v.name}
                {v.status !== 'available' ? ` (${t.common.unavailable})` : ''}
              </option>
            ))}
          </select>
        </label>

        {kendaraanTerpilih ? (
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t.booking.rateCategory}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {kendaraanTerpilih.rateLepasKunci !== null
                ? kartuKategori(
                    'lepas-kunci',
                    t.common.lepasKunci,
                    t.common.lepasKunciNote,
                    kendaraanTerpilih.rateLepasKunci,
                  )
                : null}
              {kendaraanTerpilih.ratePelayanan !== null
                ? kartuKategori(
                    'pelayanan',
                    t.common.pelayanan,
                    t.common.pelayananNote,
                    kendaraanTerpilih.ratePelayanan,
                  )
                : null}
            </div>
          </fieldset>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.startDate}</span>
            <input
              type="date"
              {...register('startDate', { required: true })}
              className={kelasInput}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.endDate}</span>
            <input type="date" {...register('endDate', { required: true })} className={kelasInput} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.fullName}</span>
            <input {...register('customerName', { required: true })} className={kelasInput} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.whatsappNumber}</span>
            <input
              {...register('phone', { required: true })}
              placeholder="081234567890"
              className={kelasInput}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.emailOptional}</span>
          <input type="email" {...register('email')} className={kelasInput} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.notesOptional}</span>
          <textarea
            rows={3}
            {...register('notes')}
            placeholder={t.booking.notesPlaceholder}
            className={kelasInput}
          />
        </label>

        <button
          type="submit"
          disabled={mengirim}
          className="rounded-lg bg-lians-500 px-6 py-3 font-semibold text-white hover:bg-lians-600 disabled:opacity-50"
        >
          {mengirim ? t.booking.submitting : t.booking.submit}
        </button>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <PriceSummary breakdown={breakdown} pesan={pesanHarga} locale={locale} />
      </aside>
    </form>
  );
}
