import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSupplierById, getSupplierVehicles } from '@/queries/suppliers';
import { SupplierForm } from '@/components/admin/SupplierForm';
import { SupplierVehicleList } from '@/components/admin/SupplierVehicleList';
import { DeleteButton } from '@/components/admin/DeleteButton';
import {
  updateSupplier,
  deleteSupplier,
  addSupplierVehicle,
  deleteSupplierVehicle,
} from '@/actions/admin-suppliers';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PemasokEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [pemasok, kendaraan] = await Promise.all([getSupplierById(id), getSupplierVehicles(id)]);
  if (!pemasok) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateSupplier(id, input);
  }

  async function hapus() {
    'use server';
    return deleteSupplier(id);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/pemasok" className="text-sm text-muted hover:text-lians-600">
            ← Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-black">{pemasok.name}</h1>
        </div>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/pemasok"
          konfirmasi={`Hapus ${pemasok.name} beserta daftar kendaraannya? Riwayat pesanan tetap tersimpan.`}
        />
      </div>

      <SupplierForm supplier={pemasok} onSubmit={simpan} />

      <SupplierVehicleList
        supplierId={id}
        kendaraan={kendaraan}
        onAdd={addSupplierVehicle}
        onDelete={deleteSupplierVehicle}
      />
    </div>
  );
}
