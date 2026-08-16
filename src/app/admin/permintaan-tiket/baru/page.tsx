import Link from 'next/link';
import { ManualTicketRequestForm } from '@/components/admin/ManualTicketRequestForm';
import { createManualTicketRequest } from '@/actions/admin-manual-permintaan';
import { getCustomers } from '@/queries/customers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PermintaanTiketBaruPage() {
  await requireAdminPage();
  const pelanggan = await getCustomers();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/permintaan-tiket" className="text-sm text-muted hover:text-lians-600">
          ← Kembali ke daftar
        </Link>
        <h1 className="text-2xl font-black">Catat Permintaan Tiket</h1>
        <p className="mt-1 text-sm text-muted">
          Harga tidak dicatat di sini — tarif penerbangan berubah tiap jam, jadi penawarannya
          tetap disepakati lewat WhatsApp.
        </p>
      </div>

      <ManualTicketRequestForm
        pelanggan={pelanggan.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
        }))}
        onSubmit={createManualTicketRequest}
      />
    </div>
  );
}
