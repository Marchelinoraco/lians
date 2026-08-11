import { RouteForm } from '@/components/admin/RouteForm';
import { createRoute } from '@/actions/admin-routes';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function RuteBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Rute</h1>
      <RouteForm route={null} onSubmit={createRoute} />
    </div>
  );
}
