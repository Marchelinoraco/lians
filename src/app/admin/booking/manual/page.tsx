import Link from 'next/link';
import { ManualBookingForm } from '@/components/admin/ManualBookingForm';
import { createManualBooking } from '@/actions/admin-manual-booking';
import { cekBentrokUnit } from '@/actions/admin-fleet-units';
import { getFleetUnitsAktif } from '@/queries/fleet-units';
import { getAllSupplierVehicles } from '@/queries/suppliers';
import { getCustomers } from '@/queries/customers';
import { getAllVehicles } from '@/queries/vehicles';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function BookingManualPage() {
  await requireAdminPage();

  const [armada, unitArmada, kendaraanPemasok, pelanggan] = await Promise.all([
    getAllVehicles(),
    getFleetUnitsAktif(),
    getAllSupplierVehicles(),
    getCustomers(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/booking" className="text-sm text-muted hover:text-lians-600">
          ← Kembali ke daftar
        </Link>
        <h1 className="text-2xl font-black">Catat Booking Manual</h1>
        <p className="mt-1 text-sm text-muted">
          Untuk pesanan yang masuk lewat telepon atau tatap muka, bukan lewat situs.
        </p>
      </div>

      <ManualBookingForm
        armada={armada.map((v) => ({ id: v.id, name: v.name }))}
        unitArmada={unitArmada}
        onCekBentrok={cekBentrokUnit}
        kendaraanPemasok={kendaraanPemasok}
        pelanggan={pelanggan.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
        }))}
        onSubmit={createManualBooking}
      />
    </div>
  );
}
