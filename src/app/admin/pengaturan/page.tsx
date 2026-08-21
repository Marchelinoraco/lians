import { getSettings } from '@/queries/settings';
import { getStaffUsers } from '@/queries/users';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { StaffManager } from '@/components/admin/StaffManager';
import { PasswordForm } from '@/components/admin/PasswordForm';
import { updateSettings, createStaffUser, deleteStaffUser } from '@/actions/admin-settings';
import { changeOwnPassword, resetStaffPassword } from '@/actions/admin-account';
import { requireAdminPage, sesiSekarang } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function PengaturanPage() {
  const sesi = await requireAdminPage();
  const pemilik = (await sesiSekarang())?.role === 'super_admin';

  // Daftar akun hanya diambil bila berhak. Kuerinya sendiri sudah menolak staf
  // biasa, jadi memanggilnya tanpa syarat akan melempar galat dan merusak
  // seluruh halaman Pengaturan — padahal bagian lainnya memang boleh dibuka staf.
  const [settings, staf] = await Promise.all([getSettings(), pemilik ? getStaffUsers() : []]);

  async function hapusStaf(id: string) {
    'use server';
    return deleteStaffUser(id);
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-black">Pengaturan</h1>
      <SettingsForm settings={settings} onSubmit={updateSettings} />
      <PasswordForm onSubmit={changeOwnPassword} />
      {pemilik ? (
        <StaffManager
          staf={staf}
          emailSaya={sesi.email}
          onCreate={createStaffUser}
          onDelete={hapusStaf}
          onReset={resetStaffPassword}
        />
      ) : null}
    </div>
  );
}
