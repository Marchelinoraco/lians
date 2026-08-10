import type { Vehicle } from '@/db/schema';
import { getMessages, type Locale } from '@/i18n';
import { VehicleCard } from './VehicleCard';

export function VehicleGrid({ vehicles, locale }: { vehicles: Vehicle[]; locale: Locale }) {
  if (vehicles.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 p-12 text-center text-muted">
        {getMessages(locale).catalog.empty}
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((v) => (
        <VehicleCard key={v.id} vehicle={v} locale={locale} />
      ))}
    </div>
  );
}
