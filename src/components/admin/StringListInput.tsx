'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { KELAS_ISIAN_DASAR } from './kelas-form';

export function StringListInput({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState('');

  function tambah() {
    const teks = draft.trim();
    if (!teks) return;
    onChange([...values, teks]);
    setDraft('');
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter menambah item, bukan mengirim seluruh form.
            if (e.key === 'Enter') {
              e.preventDefault();
              tambah();
            }
          }}
          placeholder={placeholder}
          aria-label={label}
          className={`flex-1 ${KELAS_ISIAN_DASAR}`}
        />
        <button
          type="button"
          onClick={tambah}
          aria-label={`Tambahkan ${label}`}
          className="rounded-lg border border-slate-300 px-3 hover:border-lians-400"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {values.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {values.map((v, i) => (
            <li
              key={`${v}-${i}`}
              className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm"
            >
              {v}
              <button
                type="button"
                aria-label={`Hapus ${v}`}
                onClick={() => onChange(values.filter((_, j) => j !== i))}
                className="text-slate-500 hover:text-red-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
