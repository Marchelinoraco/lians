'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Car,
  CalendarCheck,
  Users,
  Route,
  Star,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/cn';

const ITEM = [
  { href: '/', label: 'Dasbor', Icon: LayoutDashboard },
  { href: '/armada', label: 'Armada', Icon: Car },
  { href: '/booking', label: 'Booking', Icon: CalendarCheck },
  { href: '/pelanggan', label: 'Pelanggan', Icon: Users },
  { href: '/rute', label: 'Rute Travel', Icon: Route },
  { href: '/testimoni', label: 'Testimoni', Icon: Star },
  { href: '/pengaturan', label: 'Pengaturan', Icon: Settings },
];

export function AdminNav({ email, pendingCount }: { email: string; pendingCount: number }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-200 p-5">
        <p className="text-xl font-black text-lians-600">LIANS</p>
        <p className="truncate text-xs text-muted">{email}</p>
      </div>

      <nav aria-label="Navigasi admin" className="flex-1 space-y-1 p-3">
        {ITEM.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
              pathname === href ? 'bg-lians-50 text-lians-700' : 'text-slate-600 hover:bg-slate-50',
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
            {href === '/booking' && pendingCount > 0 ? (
              <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                {pendingCount}
              </span>
            ) : null}
          </Link>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-2 border-t border-slate-200 px-5 py-4 text-sm font-medium text-slate-600 hover:bg-slate-50"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Keluar
      </button>
    </aside>
  );
}
