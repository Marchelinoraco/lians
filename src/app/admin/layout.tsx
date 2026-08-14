import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { SessionProvider } from 'next-auth/react';
import '@/app/globals.css';
import { auth } from '@/lib/auth';
import { getPendingCount } from '@/queries/bookings';
import { AdminNav } from '@/components/admin/AdminNav';
import { sesiSekarang } from '@/actions/auth-guard';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta',
  display: 'swap',
});

export const metadata = {
  title: 'Admin LIANS',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * Root layout panel admin. Semua yang di bawahnya wajib bersesi — halaman login
 * berada di luar folder ini justru karena itu.
 *
 * Penjaga sesi ada di sini, bukan di proxy.ts, karena bcryptjs tidak dapat
 * berjalan di Edge Runtime tempat proxy dieksekusi. Setiap Server Action admin
 * memeriksa sesinya sendiri sebagai lapisan kedua, sehingga permintaan yang
 * menembak action langsung tetap tertolak.
 *
 * Panel admin hanya berbahasa Indonesia: penggunanya staf lokal.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [pendingCount, sesi] = await Promise.all([getPendingCount(), sesiSekarang()]);

  return (
    <html lang="id-ID" className={jakarta.variable}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <div className="flex min-h-screen bg-slate-50">
            <AdminNav
              email={session.user.email ?? ''}
              pendingCount={pendingCount}
              superAdmin={sesi?.role === 'super_admin'}
            />
            {/* Tanpa overflow-x-auto di sini: properti itu membuat <main>
                menjadi wadah gulir sendiri, dan semua yang position:sticky di
                dalamnya (baris tombol simpan) berhenti menempel. Setiap tabel
                admin sudah punya pembungkus overflow-nya masing-masing. */}
            <main className="min-w-0 flex-1 p-8">{children}</main>
            <Toaster position="top-right" richColors />
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
