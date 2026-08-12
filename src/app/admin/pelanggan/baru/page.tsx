import { CustomerForm } from '@/components/admin/CustomerForm';
import { createCustomer } from '@/actions/admin-customers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PelangganBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Pelanggan</h1>
      <CustomerForm customer={null} onSubmit={createCustomer} />
    </div>
  );
}
