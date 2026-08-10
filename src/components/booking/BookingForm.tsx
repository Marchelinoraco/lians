'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { calculateRentalPrice, type PriceBreakdown, type RateType } from '@/lib/pricing';
import { countRentalDays } from '@/lib/dates';
import { formatRupiah } from '@/lib/format';
import { getMessages, fill, localeHref, type Locale } from '@/i18n';
import type { ActionResult } from '@/actions/result';
import { PriceSummary } from './PriceSummary';

export type BookingVehicleOption = {
  id: string;
  slug: string;
  name: string;
  rate24h: number;
  rate12h: number | null;
  driverFeeOverride: number | null;
  status: 'available' | 'unavailable';
};

export type BookingRouteOption = { id: string; label: string; price: number | null };

type FormValues = {
  serviceType: 'self-drive' | 'with-driver' | 'tourism' | 'travel';
  vehicleId: string;
  routeId: string;
  startDate: string;
  endDate: string;
  rateType: RateType;
  driverDays: number;
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
  driverFeePerDay,
  defaultVehicleSlug,
  defaultRouteId,
  onSubmit,
  locale,
}: {
  vehicles: BookingVehicleOption[];
  routes: BookingRouteOption[];
  driverFeePerDay: number;
  defaultVehicleSlug: string | null;
  defaultRouteId: string | null;
  onSubmit: SubmitFn;
  locale: Locale;
}) {
  const t = getMessages(locale);
  const [mengirim, setMengirim] = useState(false);

  const { register, watch, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      serviceType: defaultRouteId ? 'travel' : 'self-drive',
      vehicleId: vehicles.find((v) => v.slug === defaultVehicleSlug)?.id ?? '',
      routeId: defaultRouteId ?? '',
      startDate: '',
      endDate: '',
      rateType: '24h',
      driverDays: 0,
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
        rate24h: kendaraanTerpilih.rate24h,
        rate12h: kendaraanTerpilih.rate12h,
        driverFeeOverride: kendaraanTerpilih.driverFeeOverride,
      },
      startDate: new Date(nilai.startDate),
      endDate: new Date(nilai.endDate),
      rateType: nilai.rateType,
      driverDays: Number(nilai.driverDays) || 0,
      driverFeePerDay,
    });

    if (hasil.ok) return { breakdown: hasil.breakdown };
    return { breakdown: null, pesanHarga: t.pricingError[hasil.error] };
  }, [
    adalahTravel,
    rutePilihan,
    kendaraanTerpilih,
    nilai.startDate,
    nilai.endDate,
    nilai.rateType,
    nilai.driverDays,
    driverFeePerDay,
    t,
  ]);

  // Dihitung terpisah dari hasil harga, bukan diambil dari breakdown.
  // Saat hari sopir berlebih, perhitungan harga justru gagal dan breakdown
  // menjadi null — peringatannya akan hilang tepat ketika paling dibutuhkan.
  const jumlahHari =
    !adalahTravel && nilai.startDate && nilai.endDate
      ? countRentalDays(new Date(nilai.startDate), new Date(nilai.endDate))
      : null;

  const sopirBerlebih =
    !adalahTravel && jumlahHari !== null && Number(nilai.driverDays) > jumlahHari;

  const kirim = handleSubmit(async (v) => {
    setMengirim(true);

    const payload = adalahTravel
      ? {
          serviceType: 'travel',
          routeId: v.routeId,
          startDate: v.startDate,
          driverDays: 0,
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
          rateType: v.rateType,
          driverDays: Number(v.driverDays) || 0,
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

  return (
    <form onSubmit={kirim} className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">{t.booking.serviceType}</span>
          <select {...register('serviceType')} className={kelasInput}>
            <option value="self-drive">{t.booking.selfDrive}</option>
            <option value="with-driver">{t.booking.withDriver}</option>
            <option value="tourism">{t.booking.tourism}</option>
            <option value="travel">{t.booking.travelService}</option>
          </select>
        </label>

        {adalahTravel ? (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.route}</span>
            <select {...register('routeId', { required: true })} className={kelasInput}>
              <option value="">{t.booking.chooseRoute}</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                  {r.price === null ? ` — ${t.common.contactForPrice}` : ` — ${formatRupiah(r.price)}`}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.vehicle}</span>
            <select {...register('vehicleId', { required: true })} className={kelasInput}>
              <option value="">{t.booking.chooseVehicle}</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id} disabled={v.status !== 'available'}>
                  {v.name} — {formatRupiah(v.rate24h)} / {t.common.perDay24}
                  {v.status !== 'available' ? ` (${t.common.unavailable})` : ''}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold">{t.booking.startDate}</span>
            <input
              type="date"
              {...register('startDate', { required: true })}
              className={kelasInput}
            />
          </label>

          {!adalahTravel ? (
            <label className="block">
              <span className="mb-1 block text-sm font-semibold">{t.booking.endDate}</span>
              <input
                type="date"
                {...register('endDate', { required: true })}
                className={kelasInput}
              />
            </label>
          ) : null}
        </div>

        {!adalahTravel && kendaraanTerpilih && kendaraanTerpilih.rate12h !== null ? (
          <fieldset>
            <legend className="mb-1 text-sm font-semibold">{t.booking.ratePackage}</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="24h" {...register('rateType')} /> {t.common.perDay24} (
                {formatRupiah(kendaraanTerpilih.rate24h)})
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" value="12h" {...register('rateType')} /> {t.common.perDay12} (
                {formatRupiah(kendaraanTerpilih.rate12h)})
              </label>
            </div>
          </fieldset>
        ) : null}

        {!adalahTravel ? (
          <label className="block max-w-xs">
            <span className="mb-1 block text-sm font-semibold">{t.booking.driverDays}</span>
            <input
              type="number"
              min={0}
              max={jumlahHari ?? undefined}
              {...register('driverDays', { valueAsNumber: true })}
              className={kelasInput}
            />
            <span className="mt-1 block text-xs text-muted">
              {t.booking.driverDaysHint}
              {jumlahHari !== null ? ` ${fill(t.booking.driverDaysMax, { n: jumlahHari })}` : ''}
            </span>
            {sopirBerlebih ? (
              <span role="alert" className="mt-1 block text-xs font-medium text-red-600">
                {fill(t.booking.driverDaysTooMany, { n: jumlahHari })}
              </span>
            ) : null}
          </label>
        ) : null}

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
          disabled={mengirim || sopirBerlebih}
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
