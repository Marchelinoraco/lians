import Link from 'next/link';
import { FleetUnitForm } from '@/components/admin/FleetUnitForm';
import { createFleetUnit } from '@/actions/admin-fleet-units';
import { getAllVehicles } from '@/queries/vehicles';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function UnitBaruPage() {
  await requireAdminPage();
  const armada = await getAllVehicles();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/kendaraan-lians" className="text-sm text-muted hover:text-lians-600">
          ← Kembali ke daftar
        </Link>
        <h1 className="text-2xl font-black">Tambah Unit</h1>
      </div>

      <FleetUnitForm
        awal={null}
        model={armada.map((v) => ({ id: v.id, name: v.name }))}
        onSubmit={createFleetUnit}
      />
    </div>
  );
}
