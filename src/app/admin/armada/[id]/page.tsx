import { notFound } from 'next/navigation';
import { getVehicleById } from '@/queries/vehicles';
import { VehicleForm } from '@/components/admin/VehicleForm';
import { updateVehicle, deleteVehicle } from '@/actions/admin-vehicles';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function ArmadaEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateVehicle(id, input);
  }

  async function hapus() {
    'use server';
    return deleteVehicle(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Ubah: {vehicle.name}</h1>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/armada"
          konfirmasi={`Hapus ${vehicle.name}? Riwayat pesanan tetap tersimpan.`}
        />
      </div>
      <VehicleForm vehicle={vehicle} onSubmit={simpan} />
    </div>
  );
}
