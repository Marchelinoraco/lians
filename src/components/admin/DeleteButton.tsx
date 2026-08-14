'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { ActionResult } from '@/actions/result';

export function DeleteButton({
  onDelete,
  redirectTo,
  konfirmasi,
}: {
  onDelete: () => Promise<ActionResult<{ id: string }>>;
  redirectTo: string;
  konfirmasi: string;
}) {
  const router = useRouter();
  const [menghapus, setMenghapus] = useState(false);

  async function klik() {
    if (!window.confirm(konfirmasi)) return;
    setMenghapus(true);

    const hasil = await onDelete();
    setMenghapus(false);

    if (!hasil.ok) {
      toast.error(hasil.message);
      return;
    }
    router.push(redirectTo);
  }

  return (
    <button
      type="button"
      onClick={klik}
      disabled={menghapus}
      className="flex items-center gap-1.5 rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" aria-hidden /> {menghapus ? 'Menghapus…' : 'Hapus'}
    </button>
  );
}
