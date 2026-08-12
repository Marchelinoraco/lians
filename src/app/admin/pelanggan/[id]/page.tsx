import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCustomerById, getCustomerBookings } from '@/queries/customers';
import { CustomerForm } from '@/components/admin/CustomerForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateCustomer, deleteCustomer } from '@/actions/admin-customers';
import { formatRupiah } from '@/lib/format';
import { formatTanggal } from '@/lib/dates';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PelangganEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [pelanggan, riwayat] = await Promise.all([getCustomerById(id), getCustomerBookings(id)]);
  if (!pelanggan) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateCustomer(id, input);
  }

  async function hapus() {
    'use server';
    return deleteCustomer(id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/pelanggan" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{pelanggan.name}</h1>
        </div>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/pelanggan"
          konfirmasi={`Hapus ${pelanggan.name}? Riwayat pesanannya tetap tersimpan.`}
        />
      </div>

      <CustomerForm customer={pelanggan} onSubmit={simpan} />

      <section className="max-w-3xl space-y-3">
        <h2 className="font-bold">Riwayat pesanan ({riwayat.length})</h2>
        {riwayat.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-muted">
            Belum ada pesanan atas nama pelanggan ini.
          </p>
        ) : (
          <ul className="space-y-2">
            {riwayat.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/booking/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:border-lians-300"
                >
                  <span>
                    <span className="font-semibold">
                      {b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—'}
                    </span>
                    <span className="block text-xs text-muted">
                      {b.bookingCode} · {formatTanggal(new Date(b.startDate), 'id')}
                    </span>
                  </span>
                  <span className="font-bold text-lians-600">
                    {b.totalPrice === null ? 'Menunggu penawaran' : formatRupiah(b.totalPrice)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
