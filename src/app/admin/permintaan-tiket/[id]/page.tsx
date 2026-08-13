import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getTicketRequestById } from '@/queries/ticket-requests';
import { getSettings } from '@/queries/settings';
import { namaMaskapai } from '@/data/maskapai';
import { formatTanggal } from '@/lib/dates';
import { waLink } from '@/lib/whatsapp';
import { BookingStatusControl } from '@/components/admin/BookingStatusControl';
import { DeleteButton } from '@/components/admin/DeleteButton';
import {
  updateTicketRequestStatus,
  updateTicketRequestNotes,
  deleteTicketRequest,
} from '@/actions/admin-ticket-requests';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function DetailPermintaanTiketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();

  const { id } = await params;
  const [permintaan, settings] = await Promise.all([getTicketRequestById(id), getSettings()]);
  if (!permintaan) notFound();

  async function ubahStatus(status: string) {
    'use server';
    return updateTicketRequestStatus(id, status);
  }

  async function simpanCatatan(catatan: string) {
    'use server';
    return updateTicketRequestNotes(id, catatan);
  }

  async function hapus() {
    'use server';
    return deleteTicketRequest(id);
  }

  const maskapai = namaMaskapai(permintaan.airline);

  const baris: [string, string][] = [
    ['Kode', permintaan.requestCode],
    ['Rute', `${permintaan.origin} → ${permintaan.destination}`],
    ['Maskapai', maskapai ?? 'Belum menentukan — perlu dibantu memilih'],
    ['Keberangkatan', formatTanggal(new Date(permintaan.departureDate), 'id')],
    [
      'Kembali',
      permintaan.returnDate ? formatTanggal(new Date(permintaan.returnDate), 'id') : 'Sekali jalan',
    ],
    ['Jumlah penumpang', `${permintaan.pax} orang`],
    ['Masuk', formatTanggal(new Date(permintaan.createdAt), 'id')],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/permintaan-tiket" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{permintaan.customerName}</h1>
        </div>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/permintaan-tiket"
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
            <p className="mt-4 text-xs text-muted">
              Harga sengaja tidak disimpan: tarif penerbangan berubah tiap jam. Catat kesepakatannya
              di catatan internal setelah penawaran disetujui.
            </p>
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
                      `Halo ${permintaan.customerName}, mengenai permintaan tiket ${permintaan.origin} → ${permintaan.destination} (${permintaan.requestCode}).`,
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
              `Penawaran tiket ${permintaan.origin} → ${permintaan.destination} untuk ${permintaan.customerName} (${permintaan.requestCode}), ${permintaan.pax} penumpang.`,
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
