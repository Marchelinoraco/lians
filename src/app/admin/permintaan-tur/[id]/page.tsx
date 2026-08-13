import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTourRequestById } from '@/queries/tour-requests';
import { getSettings } from '@/queries/settings';
import { getTourBySlug } from '@/data/tours';
import { formatTanggal } from '@/lib/dates';
import { waLink } from '@/lib/whatsapp';
import { BookingStatusControl } from '@/components/admin/BookingStatusControl';
import { DeleteButton } from '@/components/admin/DeleteButton';
import {
  updateTourRequestStatus,
  updateTourRequestNotes,
  deleteTourRequest,
} from '@/actions/admin-tour-requests';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function DetailPermintaanTurPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();

  const { id } = await params;
  const [permintaan, settings] = await Promise.all([getTourRequestById(id), getSettings()]);
  if (!permintaan) notFound();

  async function ubahStatus(status: string) {
    'use server';
    return updateTourRequestStatus(id, status);
  }

  async function simpanCatatan(catatan: string) {
    'use server';
    return updateTourRequestNotes(id, catatan);
  }

  async function hapus() {
    'use server';
    return deleteTourRequest(id);
  }

  // Paket bisa saja sudah dikeluarkan dari daftar sejak permintaan ini masuk.
  // Nama yang disalin tetap terbaca, hanya tautannya yang tidak ditampilkan.
  const paketMasihAda = getTourBySlug(permintaan.tourSlug) !== null;

  const baris: [string, string][] = [
    ['Kode', permintaan.requestCode],
    ['Paket', permintaan.tourNameSnapshot],
    ['Jumlah peserta', `${permintaan.pax} orang`],
    ['Tanggal mulai', formatTanggal(new Date(permintaan.startDate), 'id')],
    [
      'Tanggal selesai',
      permintaan.endDate ? formatTanggal(new Date(permintaan.endDate), 'id') : '—',
    ],
    ['Masuk', formatTanggal(new Date(permintaan.createdAt), 'id')],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/permintaan-tur" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{permintaan.customerName}</h1>
        </div>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/permintaan-tur"
          konfirmasi={`Hapus permintaan ${permintaan.requestCode}? Tindakan ini tidak bisa dibatalkan.`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold">Rincian permintaan</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              {baris.map(([k, v]) => (
                <div key={k}>
                  <dt className="text-xs text-muted">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            {paketMasihAda ? (
              <a
                href={`/tours/${permintaan.tourSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-semibold text-lians-600"
              >
                Lihat halaman paket ↗
              </a>
            ) : (
              <p className="mt-4 text-xs text-muted">
                Paket ini sudah tidak tayang di situs. Namanya tetap tersimpan pada permintaan.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="mb-4 font-bold">Kontak pelanggan</h2>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-muted">WhatsApp</dt>
                <dd>
                  <a
                    href={waLink(
                      permintaan.phone,
                      `Halo ${permintaan.customerName}, mengenai permintaan paket ${permintaan.tourNameSnapshot} (${permintaan.requestCode}).`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-lians-600"
                  >
                    {permintaan.phone}
                  </a>
                </dd>
              </div>
              {permintaan.email ? (
                <div>
                  <dt className="text-xs text-muted">Email</dt>
                  <dd className="font-medium">{permintaan.email}</dd>
                </div>
              ) : null}
            </dl>

            {permintaan.notes ? (
              <div className="mt-4">
                <p className="text-xs text-muted">Catatan dari pelanggan</p>
                <p className="mt-1 rounded-lg bg-slate-50 p-3 text-sm">{permintaan.notes}</p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="space-y-6">
          <BookingStatusControl
            status={permintaan.status}
            catatan={permintaan.adminNotes ?? ''}
            onStatus={ubahStatus}
            onNotes={simpanCatatan}
          />

          <a
            href={waLink(
              settings.whatsappNumber,
              `Penawaran paket ${permintaan.tourNameSnapshot} untuk ${permintaan.customerName} (${permintaan.requestCode}), ${permintaan.pax} orang.`,
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
