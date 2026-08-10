import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export class SesiTidakValidError extends Error {
  constructor() {
    super('Sesi tidak valid. Silakan login kembali.');
    this.name = 'SesiTidakValidError';
  }
}

/**
 * Dipanggil di awal SETIAP Server Action admin.
 * Layout admin juga memeriksa sesi, tetapi layout tidak melindungi permintaan
 * yang menembak action secara langsung.
 */
export async function requireSession(): Promise<{ id: string; email: string }> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) throw new SesiTidakValidError();
  return { id, email: session?.user?.email ?? '' };
}

/**
 * Penjaga untuk halaman admin, dipanggil di baris pertama SETIAP halaman.
 *
 * Redirect di layout menghasilkan status 307 yang benar, tetapi tidak
 * menghentikan komponen halaman anak dari render: Next merender keduanya
 * bersamaan. Tanpa penjaga ini, permintaan tanpa sesi tetap menjalankan kueri
 * dan menyisipkan ringkasan angka — termasuk nilai pendapatan — ke dalam badan
 * respons yang ikut terkirim bersama redirect.
 */
export async function requireAdminPage(): Promise<{ id: string; email: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  return { id: session.user.id, email: session.user.email ?? '' };
}
