import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { vehicles } = await import('@/db/schema');
const { createVehicle, updateVehicle, deleteVehicle } = await import('@/actions/admin-vehicles');
const { getPublishedVehicles, getVehicleBySlug } = await import('@/queries/vehicles');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });
const tanpaSesi = () => authMock.mockResolvedValue(null);

const kendaraanBaru = (nama: string) => ({
  name: nama,
  category: 'mpv' as const,
  rateLepasKunci: 600000,
  ratePelayanan: 900000,
  serviceTypes: ['self-drive' as const, 'with-driver' as const],
  seats: 7,
  transmission: 'automatic' as const,
  fuelType: 'petrol' as const,
  year: 2024,
  luggage: 2,
  images: [],
  features: { id: ['AC Dingin'], en: ['Cold AC'] },
  rentalTerms: { id: ['Lepas kunci'] },
  status: 'available' as const,
  isPublished: true,
  sortOrder: 999,
});

jalankan('Server Action armada', () => {
  it('menolak seluruh operasi tanpa sesi', async () => {
    tanpaSesi();
    expect(await createVehicle(kendaraanBaru('Tak Boleh Masuk'))).toMatchObject({ ok: false });
    expect(await updateVehicle('id-palsu', kendaraanBaru('X'))).toMatchObject({ ok: false });
    expect(await deleteVehicle('id-palsu')).toMatchObject({ ok: false });

    const katalog = await getPublishedVehicles();
    expect(katalog.some((v) => v.name === 'Tak Boleh Masuk')).toBe(false);
  });

  it('membuat kendaraan dan langsung tampil di katalog publik', async () => {
    bersesi();
    const nama = `Uji Armada ${Date.now()}`;
    const hasil = await createVehicle(kendaraanBaru(nama));

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    dibuat.push(hasil.data.id);

    const katalog = await getPublishedVehicles();
    expect(katalog.some((v) => v.id === hasil.data.id)).toBe(true);
  });

  it('menurunkan slug dari nama dan menjaganya tetap unik', async () => {
    bersesi();
    const a = await createVehicle(kendaraanBaru('Slug Kembar'));
    const b = await createVehicle(kendaraanBaru('Slug Kembar'));
    expect(a.ok && b.ok).toBe(true);
    if (!a.ok || !b.ok) return;
    dibuat.push(a.data.id, b.data.id);

    const [rowA] = await db.select().from(vehicles).where(eq(vehicles.id, a.data.id));
    const [rowB] = await db.select().from(vehicles).where(eq(vehicles.id, b.data.id));
    expect(rowA.slug).toBe('slug-kembar');
    expect(rowB.slug).toBe('slug-kembar-2');
  });

  it('menerima kendaraan yang hanya punya satu kategori tarif', async () => {
    bersesi();
    const hasil = await createVehicle({
      ...kendaraanBaru(`Satu Tarif ${Date.now()}`),
      rateLepasKunci: null,
    });
    expect(hasil.ok).toBe(true);
    if (hasil.ok) dibuat.push(hasil.data.id);
  });

  it('menolak kendaraan tanpa tarif sama sekali', async () => {
    bersesi();
    const hasil = await createVehicle({
      ...kendaraanBaru('Tanpa Tarif'),
      rateLepasKunci: null,
      ratePelayanan: null,
    });
    expect(hasil.ok).toBe(false);
  });

  it('menolak fasilitas tanpa versi bahasa Indonesia', async () => {
    bersesi();
    const hasil = await createVehicle({
      ...kendaraanBaru('Tanpa Indonesia'),
      features: { en: ['Cold AC'] },
    });
    expect(hasil.ok).toBe(false);
  });

  it('menyimpan perubahan dan memperbarui slug saat nama berubah', async () => {
    bersesi();
    const dibuatkan = await createVehicle(kendaraanBaru('Nama Lama'));
    expect(dibuatkan.ok).toBe(true);
    if (!dibuatkan.ok) return;
    dibuat.push(dibuatkan.data.id);

    const hasil = await updateVehicle(dibuatkan.data.id, {
      ...kendaraanBaru('Nama Baru'),
      rateLepasKunci: 750000,
    });
    expect(hasil.ok).toBe(true);

    const v = await getVehicleBySlug('nama-baru');
    expect(v?.id).toBe(dibuatkan.data.id);
    expect(v?.rateLepasKunci).toBe(750000);
    expect(await getVehicleBySlug('nama-lama')).toBeNull();
  });

  it('menghapus kendaraan', async () => {
    bersesi();
    const dibuatkan = await createVehicle(kendaraanBaru('Akan Dihapus'));
    expect(dibuatkan.ok).toBe(true);
    if (!dibuatkan.ok) return;

    expect(await deleteVehicle(dibuatkan.data.id)).toMatchObject({ ok: true });
    const [row] = await db.select().from(vehicles).where(eq(vehicles.id, dibuatkan.data.id));
    expect(row).toBeUndefined();
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(vehicles).where(eq(vehicles.id, id));
});
