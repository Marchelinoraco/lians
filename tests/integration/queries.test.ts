import { describe, it, expect } from 'vitest';
import { getPublishedVehicles, getVehicleBySlug } from '@/queries/vehicles';
import { getPublishedRoutes } from '@/queries/routes';
import { getSettings } from '@/queries/settings';

// Tes ini menyentuh database sungguhan. Lewati bila DATABASE_URL tidak diatur.
const jalankan = process.env.DATABASE_URL ? describe : describe.skip;

jalankan('query terhadap data seed', () => {
  it('mengembalikan kendaraan yang dipublikasikan', async () => {
    const hasil = await getPublishedVehicles();
    expect(hasil.length).toBeGreaterThan(0);
    expect(hasil.every((v) => v.isPublished)).toBe(true);
  });

  it('menemukan kendaraan berdasarkan slug', async () => {
    const v = await getVehicleBySlug('innova-zenix-g');
    expect(v?.name).toBe('Innova Zenix G');
  });

  it('mengembalikan null untuk slug yang tidak ada', async () => {
    expect(await getVehicleBySlug('mobil-tidak-ada')).toBeNull();
  });

  it('menyertakan rute tanpa tarif', async () => {
    const rute = await getPublishedRoutes();
    expect(rute.some((r) => r.price === null)).toBe(true);
  });

  it('mengembalikan pengaturan lengkap dengan alamat LIANS', async () => {
    const s = await getSettings();
    expect(s.address).toContain('Pomorow');
    expect(s.operatingHours.id).toBeTruthy();
  });

  it('menyimpan teks hero dalam keempat bahasa', async () => {
    const s = await getSettings();
    expect(s.heroTitle.id).toBeTruthy();
    expect(s.heroTitle.en).toBeTruthy();
    expect(s.heroTitle.zh).toBeTruthy();
    expect(s.heroTitle.ko).toBeTruthy();
  });

  it('menyimpan fasilitas kendaraan sebagai objek berkunci bahasa', async () => {
    const [v] = await getPublishedVehicles();
    expect(Array.isArray(v.features.id)).toBe(true);
    expect(v.features.en?.length).toBeGreaterThan(0);
  });
});
