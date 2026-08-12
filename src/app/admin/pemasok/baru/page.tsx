import { SupplierForm } from '@/components/admin/SupplierForm';
import { createSupplier } from '@/actions/admin-suppliers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PemasokBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Pemasok</h1>
      <SupplierForm supplier={null} onSubmit={createSupplier} />
    </div>
  );
}
