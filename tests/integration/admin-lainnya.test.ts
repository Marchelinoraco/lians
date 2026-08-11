import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { travelRoutes, testimonials, siteSettings, users, bookings } = await import('@/db/schema');
const { createRoute, updateRoute, deleteRoute } = await import('@/actions/admin-routes');
const { createTestimonial, deleteTestimonial } = await import('@/actions/admin-testimonials');
const { updateSettings, createStaffUser, deleteStaffUser } = await import(
  '@/actions/admin-settings'
);
const { updateBookingStatus, updateAdminNotes } = await import('@/actions/admin-bookings');
const { getPublishedRoutes } = await import('@/queries/routes');
const { getSettings, DEFAULT_SETTINGS } = await import('@/queries/settings');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;

const ruteDibuat: string[] = [];
const testimoniDibuat: string[] = [];
const stafDibuat: string[] = [];
const bookingDibuat: string[] = [];

const bersesi = (id = 'uji-admin') =>
  authMock.mockResolvedValue({ user: { id, email: 'uji@lians.id' } });
const tanpaSesi = () => authMock.mockResolvedValue(null);

jalankan('Server Action rute', () => {
  it('menolak tanpa sesi', async () => {
    tanpaSesi();
    expect(await createRoute({ origin: 'Manado', destination: 'X' })).toMatchObject({ ok: false });
  });

  it('membuat rute tanpa tarif dan menampilkannya di situs publik', async () => {
    bersesi();
    const hasil = await createRoute({
      origin: 'Manado',
      destination: `Uji Rute ${Date.now()}`,
      price: null,
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    ruteDibuat.push(hasil.data.id);

    const publik = await getPublishedRoutes();
    const dibuat = publik.find((r) => r.id === hasil.data.id);
    expect(dibuat?.price).toBeNull();
  });

  it('menyimpan waktu tempuh dalam beberapa bahasa', async () => {
    bersesi();
    const hasil = await createRoute({
      origin: 'Manado',
      destination: `Uji Bahasa ${Date.now()}`,
      price: 250000,
      estimatedDuration: { id: '45 menit', en: '45 minutes' },
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    ruteDibuat.push(hasil.data.id);

    const [row] = await db.select().from(travelRoutes).where(eq(travelRoutes.id, hasil.data.id));
    expect(row.estimatedDuration?.en).toBe('45 minutes');
  });

  it('menolak waktu tempuh yang hanya punya versi Inggris', async () => {
    bersesi();
    const hasil = await createRoute({
      origin: 'Manado',
      destination: 'Tanpa Indonesia',
      estimatedDuration: { en: '45 minutes' },
    });
    expect(hasil.ok).toBe(false);
  });

  it('mengubah dan menghapus rute', async () => {
    bersesi();
    const dibuat = await createRoute({ origin: 'Manado', destination: 'Akan Diubah' });
    expect(dibuat.ok).toBe(true);
    if (!dibuat.ok) return;

    expect(
      await updateRoute(dibuat.data.id, {
        origin: 'Manado',
        destination: 'Sudah Diubah',
        price: 500000,
      }),
    ).toMatchObject({ ok: true });

    const [row] = await db.select().from(travelRoutes).where(eq(travelRoutes.id, dibuat.data.id));
    expect(row.destination).toBe('Sudah Diubah');
    expect(row.price).toBe(500000);

    expect(await deleteRoute(dibuat.data.id)).toMatchObject({ ok: true });
  });
});

jalankan('Server Action testimoni', () => {
  it('menolak ulasan yang terlalu pendek', async () => {
    bersesi();
    const hasil = await createTestimonial({
      customerName: 'Uji',
      rating: 5,
      reviewText: { id: 'pendek' },
      date: '2026-08-01',
    });
    expect(hasil.ok).toBe(false);
  });

  it('membuat testimoni berbahasa ganda', async () => {
    bersesi();
    const hasil = await createTestimonial({
      customerName: 'Uji Testimoni',
      rating: 4,
      reviewText: { id: 'Pelayanan memuaskan sekali.', en: 'Very satisfying service.' },
      date: '2026-08-01',
      isFeatured: true,
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    testimoniDibuat.push(hasil.data.id);

    const [row] = await db.select().from(testimonials).where(eq(testimonials.id, hasil.data.id));
    expect(row.reviewText.en).toBe('Very satisfying service.');
    expect(row.isFeatured).toBe(true);
  });
});

jalankan('Server Action pengaturan', () => {
  it('menyimpan tarif sopir dan memengaruhi pembacaan berikutnya', async () => {
    bersesi();
    const asli = await getSettings();

    expect(await updateSettings({ ...asli, driverFeePerDay: 175000 })).toMatchObject({ ok: true });
    expect((await getSettings()).driverFeePerDay).toBe(175000);

    // Kembalikan ke nilai semula agar tes lain tidak terpengaruh.
    await updateSettings({ ...asli, driverFeePerDay: asli.driverFeePerDay });
    expect((await getSettings()).driverFeePerDay).toBe(asli.driverFeePerDay);
  });

  it('menolak nomor WhatsApp yang tidak valid', async () => {
    bersesi();
    const asli = await getSettings();
    const hasil = await updateSettings({ ...asli, whatsappNumber: '123' });
    expect(hasil.ok).toBe(false);
  });
});

jalankan('Server Action akun staf', () => {
  it('menolak kata sandi yang terlalu pendek', async () => {
    bersesi();
    const hasil = await createStaffUser({
      name: 'Staf Uji',
      email: `uji${Date.now()}@lians.id`,
      password: 'pendek',
    });
    expect(hasil.ok).toBe(false);
  });

  it('membuat akun staf tanpa menyimpan kata sandi apa adanya', async () => {
    bersesi();
    const email = `staf${Date.now()}@lians.id`;
    const hasil = await createStaffUser({
      name: 'Staf Uji',
      email,
      password: 'kata-sandi-panjang-sekali',
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    stafDibuat.push(hasil.data.id);

    const [row] = await db.select().from(users).where(eq(users.id, hasil.data.id));
    expect(row.passwordHash).not.toContain('kata-sandi');
    expect(row.passwordHash.startsWith('$2')).toBe(true);
  });

  it('menolak email yang sudah dipakai', async () => {
    bersesi();
    const email = `kembar${Date.now()}@lians.id`;
    const a = await createStaffUser({ name: 'Staf A', email, password: 'kata-sandi-panjang' });
    expect(a.ok).toBe(true);
    if (a.ok) stafDibuat.push(a.data.id);

    const b = await createStaffUser({ name: 'Staf B', email, password: 'kata-sandi-panjang' });
    expect(b.ok).toBe(false);
  });

  it('menolak penghapusan akun yang sedang dipakai', async () => {
    const email = `sendiri${Date.now()}@lians.id`;
    bersesi();
    const dibuat = await createStaffUser({ name: 'Sendiri', email, password: 'kata-sandi-panjang' });
    expect(dibuat.ok).toBe(true);
    if (!dibuat.ok) return;
    stafDibuat.push(dibuat.data.id);

    bersesi(dibuat.data.id);
    const hasil = await deleteStaffUser(dibuat.data.id);
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.message).toMatch(/sedang dipakai/i);
  });
});

jalankan('Server Action booking admin', () => {
  it('mengubah status dan catatan internal', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-UJI-${Date.now().toString(36).slice(-4).toUpperCase()}`,
        customerName: 'Uji Status',
        phone: '081234567890',
        serviceType: 'self-drive',
        startDate: '2099-08-01',
        endDate: '2099-08-02',
        rateType: '24h',
        driverDays: 0,
        totalPrice: 350000,
        status: 'pending',
      })
      .returning({ id: bookings.id });
    bookingDibuat.push(row.id);

    bersesi();
    expect(await updateBookingStatus(row.id, 'confirmed')).toMatchObject({ ok: true });
    expect(await updateAdminNotes(row.id, 'Sudah ditelepon.')).toMatchObject({ ok: true });

    const [sesudah] = await db.select().from(bookings).where(eq(bookings.id, row.id));
    expect(sesudah.status).toBe('confirmed');
    expect(sesudah.adminNotes).toBe('Sudah ditelepon.');
  });

  it('menolak status yang tidak dikenal', async () => {
    bersesi();
    expect(await updateBookingStatus(bookingDibuat[0], 'entah-apa')).toMatchObject({ ok: false });
  });

  it('menolak perubahan status tanpa sesi', async () => {
    tanpaSesi();
    expect(await updateBookingStatus(bookingDibuat[0], 'cancelled')).toMatchObject({ ok: false });
  });
});

afterAll(async () => {
  for (const id of ruteDibuat) await db.delete(travelRoutes).where(eq(travelRoutes.id, id));
  for (const id of testimoniDibuat) await db.delete(testimonials).where(eq(testimonials.id, id));
  for (const id of stafDibuat) await db.delete(users).where(eq(users.id, id));
  for (const id of bookingDibuat) await db.delete(bookings).where(eq(bookings.id, id));

  // Pastikan pengaturan kembali ke nilai bawaan bila tes gagal di tengah jalan.
  await db
    .insert(siteSettings)
    .values({ key: 'driverFeePerDay', value: DEFAULT_SETTINGS.driverFeePerDay as never })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: { value: DEFAULT_SETTINGS.driverFeePerDay as never },
    });
});
