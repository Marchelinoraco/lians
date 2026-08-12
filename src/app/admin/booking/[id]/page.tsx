import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getBookingById } from '@/queries/bookings';
import { adalahRincianLama } from '@/db/schema';
import { getSettings } from '@/queries/settings';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { waLink } from '@/lib/whatsapp';
import { BookingStatusControl } from '@/components/admin/BookingStatusControl';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateBookingStatus, updateAdminNotes, deleteBooking } from '@/actions/admin-bookings';
import { updateSupplierPaid } from '@/actions/admin-manual-booking';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * Pesanan Fase 1 memakai paket 24/12 jam, pesanan Fase 2 memakai kategori.
 * Keduanya harus terbaca agar riwayat tidak rusak saat model harga berganti.
 */
function LABEL_KATEGORI(b: { rateCategory: string | null; rateType: string | null }): string {
  if (b.rateCategory === 'pelayanan') return 'Pelayanan (mobil + sopir + BBM)';
  if (b.rateCategory === 'lepas-kunci') return 'Lepas kunci';
  if (b.rateType === '24h') return '24 jam (model lama)';
  if (b.rateType === '12h') return '12 jam (model lama)';
  return '—';
}

const LABEL_LAYANAN: Record<string, string> = {
  'self-drive': 'Lepas kunci',
  'with-driver': 'Dengan sopir',
  tourism: 'Bus / Hiace pariwisata',
  travel: 'Antar-jemput / travel',
};

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [booking, settings] = await Promise.all([getBookingById(id), getSettings()]);
  if (!booking) notFound();

  async function ubahStatus(status: string) {
    'use server';
    return updateBookingStatus(id, status);
  }

  async function simpanCatatan(catatan: string) {
    'use server';
    return updateAdminNotes(id, catatan);
  }

  async function hapus() {
    'use server';
    return deleteBooking(id);
  }

  const sudahLunas = booking.supplierPaid;

  // Tidak mengembalikan ActionResult: prop `action` pada <form> hanya menerima
  // fungsi yang menghasilkan void. Tombolnya hanya membalik satu boolean.
  async function tandaiLunas() {
    'use server';
    await updateSupplierPaid(id, !sudahLunas);
  }

  const rincian = booking.priceBreakdown;

  // Harga dibaca dari salinan beku di pesanan, bukan dihitung ulang dari tabel
  // vehicles — kenaikan tarif tidak boleh mengubah angka pesanan lama.
  const baris: [string, string][] = [
    ['Kode', booking.bookingCode],
    ['Layanan', LABEL_LAYANAN[booking.serviceType] ?? booking.serviceType],
    ['Pesanan', booking.vehicleNameSnapshot ?? booking.routeNameSnapshot ?? '—'],
    ['Mulai', formatTanggal(new Date(booking.startDate), 'id')],
    ['Selesai', booking.endDate ? formatTanggal(new Date(booking.endDate), 'id') : '—'],
    ['Kategori', LABEL_KATEGORI(booking)],
    ['Asal pesanan', booking.source === 'manual' ? 'Dicatat manual oleh staf' : 'Dari situs'],
    ['Dibuat', formatTanggal(new Date(booking.createdAt), 'id')],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/booking" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{booking.customerName}</h1>
        </div>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/booking"
          konfirmasi={`Hapus pesanan ${booking.bookingCode}? Tindakan ini tidak bisa dibatalkan.`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold">Rincian pesanan</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {baris.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold">Kontak pelanggan</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">WhatsApp</dt>
                <dd>
                  <a
                    href={waLink(booking.phone, `Halo ${booking.customerName}, mengenai pesanan ${booking.bookingCode}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-lians-600"
                  >
                    {booking.phone}
                  </a>
                </dd>
              </div>
              {booking.email ? (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="font-medium">{booking.email}</dd>
                </div>
              ) : null}
            </dl>
            {booking.notes ? (
              <div className="mt-4">
                <p className="text-xs text-muted">Catatan dari pelanggan</p>
                <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">{booking.notes}</p>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold">Harga saat dipesan</h2>
            {rincian ? (
              adalahRincianLama(rincian) ? (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>
                      Sewa {rincian.days} hari × {formatRupiah(rincian.ratePerDay)}
                    </dt>
                    <dd>{formatRupiah(rincian.rentalCost)}</dd>
                  </div>
                  {rincian.driverDays > 0 ? (
                    <div className="flex justify-between">
                      <dt>
                        Sopir {rincian.driverDays} hari × {formatRupiah(rincian.driverFeePerDay)}
                      </dt>
                      <dd>{formatRupiah(rincian.driverCost)}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <dt>Total</dt>
                    <dd className="text-lians-700">{formatRupiah(rincian.total)}</dd>
                  </div>
                  <p className="pt-2 text-xs text-muted">
                    Pesanan ini dibuat dengan model harga lama: paket 24 jam dengan biaya sopir
                    terpisah.
                  </p>
                </dl>
              ) : (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt>
                      {rincian.category === 'pelayanan' ? 'Pelayanan' : 'Lepas kunci'} —{' '}
                      {rincian.days} hari × {formatRupiah(rincian.ratePerDay)}
                    </dt>
                    <dd>{formatRupiah(rincian.total)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 font-bold">
                    <dt>Total</dt>
                    <dd className="text-lians-700">{formatRupiah(rincian.total)}</dd>
                  </div>
                </dl>
              )
            ) : (
              <p className="text-sm text-muted">
                Rute ini belum bertarif tetap saat dipesan. Kirimkan penawaran lewat WhatsApp, lalu
                catat kesepakatannya di catatan internal.
              </p>
            )}
            <p className="mt-3 text-xs text-muted">
              Angka ini disimpan saat pesanan dibuat dan tidak berubah meski tarif diperbarui.
            </p>
          </section>

          {booking.supplierVehicleId || booking.supplierNameSnapshot ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5">
              <h2 className="mb-4 font-bold">Kendaraan dari pemasok</h2>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted">Pemasok</dt>
                  <dd className="font-medium">{booking.supplierNameSnapshot ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Biaya ke pemasok</dt>
                  <dd className="font-medium">
                    {booking.supplierCost === null ? '—' : formatRupiah(booking.supplierCost)}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Margin</dt>
                  <dd className="font-medium">
                    {booking.totalPrice !== null && booking.supplierCost !== null
                      ? formatRupiah(booking.totalPrice - booking.supplierCost)
                      : '—'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">Status pembayaran</dt>
                  <dd
                    className={`font-semibold ${
                      sudahLunas ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {sudahLunas ? 'Sudah dibayar' : 'Belum dibayar'}
                  </dd>
                </div>
              </dl>

              <form action={tandaiLunas} className="mt-4">
                <button
                  type="submit"
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:border-lians-400"
                >
                  {sudahLunas ? 'Tandai belum dibayar' : 'Tandai sudah dibayar'}
                </button>
              </form>
            </section>
          ) : null}
        </div>

        <div className="space-y-6">
          <BookingStatusControl
            status={booking.status}
            catatan={booking.adminNotes ?? ''}
            onStatus={ubahStatus}
            onNotes={simpanCatatan}
          />

          <a
            href={waLink(
              settings.whatsappNumber,
              `Konfirmasi pesanan ${booking.bookingCode} atas nama ${booking.customerName}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-emerald-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-600"
          >
            Buka WhatsApp LIANS
          </a>
        </div>
      </div>
    </div>
  );
}
