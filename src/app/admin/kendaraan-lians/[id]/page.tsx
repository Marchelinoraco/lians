import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FleetUnitForm } from '@/components/admin/FleetUnitForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateFleetUnit, deleteFleetUnit } from '@/actions/admin-fleet-units';
import { getFleetUnitById } from '@/queries/fleet-units';
import { getAllVehicles } from '@/queries/vehicles';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function UnitDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [unit, armada] = await Promise.all([getFleetUnitById(id), getAllVehicles()]);
  if (!unit) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateFleetUnit(id, input);
  }

  async function hapus() {
    'use server';
    return deleteFleetUnit(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/kendaraan-lians" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{unit.plate}</h1>
          <p className="text-sm text-muted">{unit.vehicleNameSnapshot}</p>
        </div>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/kendaraan-lians"
          konfirmasi={`Hapus unit ${unit.plate}? Pesanan yang menautkannya akan kehilangan tautan itu.`}
        />
      </div>

      <FleetUnitForm
        awal={{
          plate: unit.plate,
          vehicleId: unit.vehicleId ?? '',
          notes: unit.notes ?? '',
          isActive: unit.isActive,
        }}
        model={armada.map((v) => ({ id: v.id, name: v.name }))}
        onSubmit={simpan}
      />
    </div>
  );
}
