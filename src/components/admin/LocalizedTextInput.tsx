'use client';

import { useState } from 'react';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n';
import type { Localized } from '@/i18n/localized';
import { LocaleTabs } from './LocaleTabs';

export function LocalizedTextInput({
  label,
  values,
  hint,
  multiline = false,
  rows = 4,
  onChange,
}: {
  label: string;
  values: Localized<string>;
  hint?: string;
  multiline?: boolean;
  rows?: number;
  onChange: (next: Localized<string>) => void;
}) {
  const [aktif, setAktif] = useState<Locale>(DEFAULT_LOCALE);

  const filled = Object.fromEntries(
    LOCALES.map((l) => [l, Boolean(values[l]?.trim())]),
  ) as Record<Locale, boolean>;

  const set = (teks: string) => onChange({ ...values, [aktif]: teks });
  const kelas = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm';

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold">
        {label}
        {aktif === DEFAULT_LOCALE ? <span className="text-red-500"> *</span> : null}
      </span>

      <LocaleTabs active={aktif} filled={filled} onChange={setAktif} />

      {multiline ? (
        <textarea
          rows={rows}
          value={values[aktif] ?? ''}
          onChange={(e) => set(e.target.value)}
          aria-label={`${label} (${aktif})`}
          className={kelas}
        />
      ) : (
        <input
          value={values[aktif] ?? ''}
          onChange={(e) => set(e.target.value)}
          aria-label={`${label} (${aktif})`}
          className={kelas}
        />
      )}

      <span className="block text-xs text-muted">
        {hint ??
          'Bahasa Indonesia wajib diisi. Bahasa lain boleh dikosongkan — pengunjung akan melihat versi Indonesia.'}
      </span>
    </div>
  );
}
