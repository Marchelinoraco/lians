import { describe, it, expect } from 'vitest';
import { vehicleInputSchema } from '@/schemas/vehicle';
import { routeInputSchema } from '@/schemas/route';
import { settingsInputSchema } from '@/schemas/settings';

const mobilValid = {
  name: 'Innova Zenix G',
  category: 'mpv' as const,
  rate24h: 900000,
  rate12h: 650000,
  serviceTypes: ['self-drive' as const],
  seats: 7,
  transmission: 'automatic' as const,
  fuelType: 'petrol' as const,
  year: 2024,
  features: { id: ['AC Dingin'], en: ['Cold AC'] },
  rentalTerms: { id: ['Lepas kunci'] },
};

describe('vehicleInputSchema', () => {
  it('menerima kendaraan dengan terjemahan sebagian', () => {
    expect(vehicleInputSchema.safeParse(mobilValid).success).toBe(true);
  });

  it('menerima kendaraan yang hanya punya versi Indonesia', () => {
    const r = vehicleInputSchema.safeParse({ ...mobilValid, features: { id: ['AC Dingin'] } });
    expect(r.success).toBe(true);
  });

  it('menolak fasilitas tanpa versi bahasa Indonesia', () => {
    const r = vehicleInputSchema.safeParse({ ...mobilValid, features: { en: ['Cold AC'] } });
    expect(r.success).toBe(false);
  });

  it('menolak tarif 12 jam yang lebih mahal dari tarif 24 jam', () => {
    const r = vehicleInputSchema.safeParse({ ...mobilValid, rate12h: 1_500_000 });
    expect(r.success).toBe(false);
  });

  it('menerima tarif 12 jam kosong', () => {
    const r = vehicleInputSchema.safeParse({ ...mobilValid, rate12h: null });
    expect(r.success).toBe(true);
  });

  it('menolak kendaraan tanpa jenis layanan', () => {
    const r = vehicleInputSchema.safeParse({ ...mobilValid, serviceTypes: [] });
    expect(r.success).toBe(false);
  });
});

describe('routeInputSchema', () => {
  const ruteDasar = { origin: 'Manado', destination: 'Bitung' };

  it('menerima rute tanpa tarif', () => {
    const r = routeInputSchema.safeParse(ruteDasar);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBeNull();
  });

  it('menerima catatan kendaraan dalam beberapa bahasa', () => {
    const r = routeInputSchema.safeParse({
      ...ruteDasar,
      estimatedDuration: { id: '1,5 jam', ko: '1시간 30분' },
    });
    expect(r.success).toBe(true);
  });

  it('menolak waktu tempuh yang hanya punya versi Korea', () => {
    const r = routeInputSchema.safeParse({
      ...ruteDasar,
      estimatedDuration: { ko: '1시간 30분' },
    });
    expect(r.success).toBe(false);
  });
});

describe('settingsInputSchema', () => {
  const settingsDasar = {
    whatsappNumber: '081234567890',
    phone: '081234567890',
    email: '',
    address: 'Jalan Pomorow, Manado',
    mapsUrl: '',
    driverFeePerDay: 150000,
    operatingHours: { id: 'Setiap hari' },
    heroTitle: { id: 'Rental Mobil Manado' },
    heroSubtitle: { id: 'Armada terawat' },
    aboutText: { id: '' },
    promoBanner: { id: '' },
  };

  it('menerima pengaturan dengan teks hanya berbahasa Indonesia', () => {
    expect(settingsInputSchema.safeParse(settingsDasar).success).toBe(true);
  });

  it('menolak nomor WhatsApp yang bukan format Indonesia', () => {
    const r = settingsInputSchema.safeParse({ ...settingsDasar, whatsappNumber: '12345' });
    expect(r.success).toBe(false);
  });

  it('menerima tarif sopir nol', () => {
    const r = settingsInputSchema.safeParse({ ...settingsDasar, driverFeePerDay: 0 });
    expect(r.success).toBe(true);
  });
});
