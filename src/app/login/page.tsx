import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/admin/LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const session = await auth();
  if (session?.user?.id) redirect('/');

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="mb-1 text-2xl font-black text-lians-600">LIANS</h1>
        <p className="mb-6 text-sm text-muted">Panel administrasi</p>
        <LoginForm />
      </div>
    </div>
  );
}
