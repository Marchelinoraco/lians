'use client';

import { useState } from 'react';
import { LOCALES, DEFAULT_LOCALE, type Locale } from '@/i18n';
import type { Localized } from '@/i18n/localized';
import { LocaleTabs } from './LocaleTabs';
import { StringListInput } from './StringListInput';

export function LocalizedListInput({
  label,
  values,
  placeholder,
  onChange,
}: {
  label: string;
  values: Localized<string[]>;
  placeholder: string;
  onChange: (next: Localized<string[]>) => void;
}) {
  const [aktif, setAktif] = useState<Locale>(DEFAULT_LOCALE);

  const filled = Object.fromEntries(
    LOCALES.map((l) => [l, (values[l]?.length ?? 0) > 0]),
  ) as Record<Locale, boolean>;

  return (
    <div className="space-y-2">
      <span className="block text-sm font-semibold">
        {label}
        <span className="text-red-500"> *</span>
      </span>

      <LocaleTabs active={aktif} filled={filled} onChange={setAktif} />

      <StringListInput
        label={`${label} (${aktif})`}
        values={values[aktif] ?? []}
        placeholder={placeholder}
        onChange={(daftar) => onChange({ ...values, [aktif]: daftar })}
      />

      <span className="block text-xs text-muted">
        Bahasa Indonesia wajib diisi. Bahasa lain boleh dikosongkan — pengunjung akan melihat versi
        Indonesia.
      </span>
    </div>
  );
}
