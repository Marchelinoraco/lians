import { notFound } from 'next/navigation';
import { getRouteById } from '@/queries/routes';
import { RouteForm } from '@/components/admin/RouteForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateRoute, deleteRoute } from '@/actions/admin-routes';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function RuteEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const route = await getRouteById(id);
  if (!route) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateRoute(id, input);
  }

  async function hapus() {
    'use server';
    return deleteRoute(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">
          Ubah: {route.origin} → {route.destination}
        </h1>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/rute"
          konfirmasi={`Hapus rute ${route.origin} → ${route.destination}?`}
        />
      </div>
      <RouteForm route={route} onSubmit={simpan} />
    </div>
  );
}
