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

export type Peran = 'admin' | 'super_admin';

/**
 * Satu-satunya tempat peran dibaca dari sesi.
 *
 * Dibaca lewat cast, bukan augmentasi `declare module 'next-auth'`: tipe
 * Session dan User di next-auth@5.0.0-beta hanya diekspor ulang dari
 * @auth/core, sehingga augmentasi tidak dijamin menyatu dan bisa patah pada
 * rilis beta berikutnya.
 *
 * Sesi lama yang terbit sebelum kolom peran ada tidak membawa role sama sekali;
 * diperlakukan sebagai admin biasa — jatuh ke hak yang paling sedikit.
 */
export async function sesiSekarang(): Promise<{
  id: string;
  email: string;
  role: Peran;
} | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const mentah = (session?.user as { role?: string } | undefined)?.role;
  const role: Peran = mentah === 'super_admin' ? 'super_admin' : 'admin';
  return { id, email: session?.user?.email ?? '', role };
}

/**
 * Dipanggil di awal setiap fungsi yang menghasilkan angka rekap keuangan.
 * Layout maupun halaman tidak melindungi permintaan yang menembak Server Action
 * secara langsung.
 */
export async function requireSuperAdmin(): Promise<{
  id: string;
  email: string;
  role: 'super_admin';
}> {
  const sesi = await sesiSekarang();
  if (!sesi || sesi.role !== 'super_admin') throw new SesiTidakValidError();
  return { id: sesi.id, email: sesi.email, role: 'super_admin' };
}

/**
 * Penjaga halaman khusus super admin.
 *
 * Admin biasa dialihkan ke dasbor, bukan ke login: sesinya sah, ia hanya tidak
 * berhak melihat halaman ini. Melemparnya ke halaman login akan terasa seperti
 * sesinya kedaluwarsa dan membuatnya mencoba login berulang-ulang.
 */
export async function requireSuperAdminPage(): Promise<{ id: string; email: string }> {
  const sesi = await sesiSekarang();
  if (!sesi) redirect('/login');
  if (sesi.role !== 'super_admin') redirect('/');
  return { id: sesi.id, email: sesi.email };
}
