import { getSettings } from '@/queries/settings';
import { getStaffUsers } from '@/queries/users';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { StaffManager } from '@/components/admin/StaffManager';
import { updateSettings, createStaffUser, deleteStaffUser } from '@/actions/admin-settings';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PengaturanPage() {
  const sesi = await requireAdminPage();
  const [settings, staf] = await Promise.all([getSettings(), getStaffUsers()]);

  async function hapusStaf(id: string) {
    'use server';
    return deleteStaffUser(id);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Pengaturan</h1>
      <SettingsForm settings={settings} onSubmit={updateSettings} />
      <StaffManager
        staf={staf}
        emailSaya={sesi.email}
        onCreate={createStaffUser}
        onDelete={hapusStaf}
      />
    </div>
  );
}
