import type { CatalogFilters } from '@/lib/vehicle-filter';
import { getMessages, type Locale } from '@/i18n';

const kelasInput =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-lians-500 focus:outline-none focus:ring-2 focus:ring-lians-200';

/**
 * Form GET biasa, bukan state di klien: filternya tercermin di URL sehingga
 * bisa dibagikan lewat WhatsApp, ditandai di peramban, dan tetap berfungsi
 * bila JavaScript gagal dimuat.
 */
export function CatalogControls({
  filters,
  locale,
}: {
  filters: CatalogFilters;
  locale: Locale;
}) {
  const t = getMessages(locale);

  const KATEGORI = [
    { value: '', label: t.catalog.allCategories },
    { value: 'hatchback', label: 'Hatchback' },
    { value: 'sedan', label: 'Sedan' },
    { value: 'suv', label: 'SUV' },
    { value: 'mpv', label: 'MPV' },
    { value: 'luxury', label: 'Luxury' },
    { value: 'bus', label: 'Bus / Hiace' },
  ];

  const URUTAN = [
    { value: '', label: t.catalog.sortDefault },
    { value: 'harga-asc', label: t.catalog.sortPriceAsc },
    { value: 'harga-desc', label: t.catalog.sortPriceDesc },
    { value: 'nama-asc', label: t.catalog.sortNameAsc },
  ];

  return (
    <form
      method="get"
      className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      <label className="lg:col-span-2">
        <span className="mb-1 block text-xs font-semibold text-slate-600">{t.catalog.search}</span>
        <input
          name="q"
          defaultValue={filters.q ?? ''}
          placeholder={t.catalog.searchPlaceholder}
          className={kelasInput}
        />
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">
          {t.catalog.category}
        </span>
        <select name="category" defaultValue={filters.category ?? ''} className={kelasInput}>
          {KATEGORI.map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">
          {t.catalog.maxPrice}
        </span>
        <input
          name="maxPrice"
          type="number"
          min={0}
          step={50000}
          defaultValue={filters.maxPrice ?? ''}
          placeholder="1000000"
          className={kelasInput}
        />
      </label>

      <label>
        <span className="mb-1 block text-xs font-semibold text-slate-600">{t.catalog.sort}</span>
        <select name="sort" defaultValue={filters.sort ?? ''} className={kelasInput}>
          {URUTAN.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      <div className="sm:col-span-2 lg:col-span-5">
        <button
          type="submit"
          className="rounded-lg bg-lians-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-lians-600"
        >
          {t.catalog.apply}
        </button>
      </div>
    </form>
  );
}
