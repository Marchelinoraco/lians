import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ManualBookingForm } from '@/components/admin/ManualBookingForm';
import { updateBooking } from '@/actions/admin-booking-edit';
import { cekBentrokUnit } from '@/actions/admin-fleet-units';
import { getFleetUnitsAktif } from '@/queries/fleet-units';
import { getBookingById } from '@/queries/bookings';
import { getAllSupplierVehicles } from '@/queries/suppliers';
import { getCustomers } from '@/queries/customers';
import { getAllVehicles } from '@/queries/vehicles';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function BookingUbahPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const booking = await getBookingById(id);
  if (!booking) notFound();

  // Pesanan yang sudah selesai adalah catatan keuangan yang sudah masuk rekap.
  // Penjaga yang sama ada di dalam Server Action-nya; yang di sini hanya agar
  // orang tidak sampai mengetik ulang satu form penuh untuk kemudian ditolak.
  if (booking.status === 'completed') redirect(`/booking/${id}`);

  const [armada, unitArmada, kendaraanPemasok, pelanggan] = await Promise.all([
    getAllVehicles(),
    getFleetUnitsAktif(),
    getAllSupplierVehicles(),
    getCustomers(),
  ]);

  async function simpan(input: unknown) {
    'use server';
    return updateBooking(id, input);
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/booking/${id}`} className="text-sm text-muted hover:text-lians-600">
          ← Kembali ke pesanan
        </Link>
        <h1 className="text-2xl font-black">Ubah Pesanan</h1>
        <p className="mt-1 text-sm text-muted">
          {booking.bookingCode} — {booking.customerName}
        </p>
      </div>

      <ManualBookingForm
        mode="ubah"
        batalKe={`/booking/${id}`}
        armada={armada.map((v) => ({ id: v.id, name: v.name }))}
        unitArmada={unitArmada}
        onCekBentrok={cekBentrokUnit}
        bookingId={id}
        kendaraanPemasok={kendaraanPemasok}
        pelanggan={pelanggan.map((p) => ({
          id: p.id,
          name: p.name,
          phone: p.phone,
          email: p.email,
        }))}
        awal={{
          customerName: booking.customerName,
          phone: booking.phone,
          email: booking.email ?? '',
          serviceType: booking.serviceType,
          // Keterangan pesanan disimpan di kolom salinan nama kendaraan —
          // untuk pesanan travel, nama rutenya yang menjadi keterangan.
          itemName: booking.vehicleNameSnapshot ?? booking.routeNameSnapshot ?? '',
          startDate: booking.startDate,
          endDate: booking.endDate ?? '',
          totalPrice: booking.totalPrice ?? '',
          asalKendaraan: booking.supplierVehicleId ? 'pemasok' : 'sendiri',
          vehicleId: booking.vehicleId ?? '',
          fleetUnitId: booking.fleetUnitId ?? '',
          supplierVehicleId: booking.supplierVehicleId ?? '',
          supplierCost: booking.supplierCost ?? '',
          supplierPaid: booking.supplierPaid,
          costFuel: booking.costFuel ?? '',
          costDriver: booking.costDriver ?? '',
          costTollParking: booking.costTollParking ?? '',
          costOther: booking.costOther ?? '',
          costOtherNote: booking.costOtherNote ?? '',
          notes: booking.notes ?? '',
          adminNotes: booking.adminNotes ?? '',
        }}
        onSubmit={simpan}
      />
    </div>
  );
}
