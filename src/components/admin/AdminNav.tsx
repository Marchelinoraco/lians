'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Map,
  Plane,
  Users,
  Truck,
  Wallet,
  Route,
  Star,
  Newspaper,
  Images,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';

type Item = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
};

export function AdminNav({
  email,
  pendingCount,
  superAdmin,
}: {
  email: string;
  pendingCount: number;
  superAdmin: boolean;
}) {
  const pathname = usePathname();

  /**
   * Dikelompokkan menurut alasan orang membukanya, bukan menurut jenis data.
   *
   * Tiga belas menu berjajar rata sama besar memaksa mata membaca seluruhnya
   * setiap kali. Dipisah begini, staf yang mencari pesanan masuk tidak perlu
   * melewati daftar armada dan artikel dulu.
   */
  const KELOMPOK: { judul: string | null; item: Item[] }[] = [
    {
      judul: null,
      item: [{ href: '/', label: 'Dasbor', Icon: LayoutDashboard }],
    },
    {
      judul: 'Yang masuk',
      item: [
        { href: '/booking', label: 'Booking', Icon: CalendarCheck },
        { href: '/permintaan-tur', label: 'Permintaan Tur', Icon: Map },
        { href: '/permintaan-tiket', label: 'Permintaan Tiket', Icon: Plane },
      ],
    },
    {
      judul: 'Data usaha',
      item: [
        { href: '/pelanggan', label: 'Pelanggan', Icon: Users },
        { href: '/pemasok', label: 'Pemasok', Icon: Truck },
        // Menu ini disembunyikan, bukan diamankan. Penjaganya ada di halaman
        // /rekap dan di dalam hitungRekap sendiri.
        ...(superAdmin ? [{ href: '/rekap', label: 'Rekap Keuangan', Icon: Wallet }] : []),
      ],
    },
    {
      judul: 'Isi situs',
      item: [
        { href: '/armada', label: 'Armada', Icon: Car },
        { href: '/rute', label: 'Rute Travel', Icon: Route },
        { href: '/testimoni', label: 'Testimoni', Icon: Star },
        { href: '/blog', label: 'Blog', Icon: Newspaper },
        { href: '/galeri', label: 'Galeri', Icon: Images },
      ],
    },
    {
      judul: null,
      item: [{ href: '/pengaturan', label: 'Pengaturan', Icon: Settings }],
    },
  ];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-5 py-4">
        <p className="text-xl font-black text-lians-600">LIANS</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>

      <nav aria-label="Navigasi admin" className="flex-1 overflow-y-auto p-3">
        {KELOMPOK.map((kelompok, i) => (
          <div key={kelompok.judul ?? `tanpa-judul-${i}`} className={i > 0 ? 'mt-5' : ''}>
            {kelompok.judul ? (
              <p className="mb-1.5 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {kelompok.judul}
              </p>
            ) : null}

            <ul className="space-y-0.5">
              {kelompok.item.map(({ href, label, Icon }) => {
                const aktif = pathname === href;

                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={aktif ? 'page' : undefined}
                      className={cn(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        aktif
                          ? 'bg-lians-50 text-lians-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-lians-600',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      {label}

                      {href === '/booking' && pendingCount > 0 ? (
                        <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold tabular-nums text-amber-800">
                          {pendingCount}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 border-t border-slate-200 px-5 py-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Keluar
      </button>
    </aside>
  );
}
