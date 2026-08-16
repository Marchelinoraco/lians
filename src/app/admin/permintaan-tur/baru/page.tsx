import Link from 'next/link';
import { ManualTourRequestForm } from '@/components/admin/ManualTourRequestForm';
import { createManualTourRequest } from '@/actions/admin-manual-permintaan';
import { getCustomers } from '@/queries/customers';
import { TOUR_PACKAGES } from '@/data/tours';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PermintaanTurBaruPage() {
  await requireAdminPage();
  const pelanggan = await getCustomers();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/permintaan-tur" className="text-sm text-muted hover:text-lians-600">
          ← Kembali ke daftar
        </Link>
        <h1 className="text-2xl font-black">Catat Permintaan Tur</h1>
        <p className="mt-1 text-sm text-muted">
          Untuk permintaan yang masuk lewat telepon atau WhatsApp, bukan lewat situs.
        </p>
      </div>

      <ManualTourRequestForm
        paket={TOUR_PACKAGES.map((p) => ({ slug: p.slug, nama: p.name.id }))}
        pelanggan={pelanggan.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
        }))}
        onSubmit={createManualTourRequest}
      />
    </div>
  );
}
