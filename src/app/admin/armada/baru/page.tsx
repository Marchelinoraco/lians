import { VehicleForm } from '@/components/admin/VehicleForm';
import { createVehicle } from '@/actions/admin-vehicles';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function ArmadaBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Kendaraan</h1>
      <VehicleForm vehicle={null} onSubmit={createVehicle} />
    </div>
  );
}
