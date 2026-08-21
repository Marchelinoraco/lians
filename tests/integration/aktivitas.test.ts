import { describe, it, expect, afterAll, vi } from 'vitest';
import { desc, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { activityLog, users } = await import('@/db/schema');
const { catatAktivitas } = await import('@/lib/aktivitas');
const { getAktivitas } = await import('@/queries/aktivitas');
const { bookings, vehicles, fleetUnits } = await import('@/db/schema');
const { createManualBooking } = await import('@/actions/admin-manual-booking');
const { updateBookingStatus, deleteBooking } = await import('@/actions/admin-bookings');
const { createFleetUnit, deleteFleetUnit } = await import('@/actions/admin-fleet-units');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const akunDibuat: string[] = [];
const catatanDibuat: string[] = [];

async function buatAkun(): Promise<{ id: string; email: string }> {
  const email = `akt${Date.now()}${Math.random().toString(36).slice(2, 6)}@lians.id`;
  const [row] = await db
    .insert(users)
    .values({ name: 'Pelaku Uji', email, passwordHash: await bcrypt.hash('sandi-panjang-123', 12) })
    .returning({ id: users.id });
  akunDibuat.push(row.id);
  return { id: row.id, email };
}

const sebagai = (id: string, email: string, role = 'admin') =>
  authMock.mockResolvedValue({ user: { id, email, role } });

async function catatan(id: string) {
  const [row] = await db.select().from(activityLog).where(eq(activityLog.userId, id));
  if (row) catatanDibuat.push(row.id);
  return row;
}

jalankan('catatAktivitas', () => {
  it('mencatat pelaku, tindakan, dan ringkasannya', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email);

    await catatAktivitas({
      aksi: 'pesanan.buat',
      ringkasan: 'Mencatat pesanan LNS-2026-0042 atas nama Grace Tumbelaka',
      entitas: 'booking',
      entitasId: 'abc-123',
    });

    const row = await catatan(akun.id);
    expect(row.action).toBe('pesanan.buat');
    expect(row.summary).toMatch(/LNS-2026-0042/);
    expect(row.entity).toBe('booking');
    // Email disalin: akun yang kelak dihapus tidak boleh membuat riwayatnya
    // kehilangan keterangan siapa pelakunya.
    expect(row.userEmailSnapshot).toBe(akun.email);
  });

  // Pencatatan tidak boleh menjatuhkan pekerjaan yang dicatatnya. Pesanan yang
  // sudah tersimpan tidak boleh dilaporkan gagal hanya karena baris riwayatnya
  // tidak jadi ditulis.
  it('menelan kegagalannya sendiri, tidak melempar galat', async () => {
    sebagai('11111111-2222-4333-8444-555555555555', 'hantu@lians.id');

    await expect(
      catatAktivitas({ aksi: 'pesanan.buat', ringkasan: 'Pelaku yang akunnya sudah tidak ada' }),
    ).resolves.toBeUndefined();
  });

  it('tidak mencatat apa pun tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const sebelum = (await db.select().from(activityLog)).length;

    await catatAktivitas({ aksi: 'pesanan.buat', ringkasan: 'Tanpa pelaku' });

    expect((await db.select().from(activityLog)).length).toBe(sebelum);
  });
});

jalankan('getAktivitas', () => {
  it('menolak dibaca staf biasa', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email, 'admin');
    await expect(getAktivitas()).rejects.toThrow(/sesi tidak valid/i);
  });

  it('menyajikan catatan terbaru lebih dulu untuk pemilik', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email);
    await catatAktivitas({ aksi: 'pesanan.buat', ringkasan: 'Yang lebih dulu' });
    await catatAktivitas({ aksi: 'pesanan.hapus', ringkasan: 'Yang terbaru' });

    sebagai(akun.id, akun.email, 'super_admin');
    const daftar = await getAktivitas();

    const punyaAkun = daftar.filter((a) => a.userId === akun.id);
    expect(punyaAkun[0].summary).toBe('Yang terbaru');
  });
});

jalankan('aksi nyata meninggalkan jejak', () => {
  const bersih: { pesanan: string[]; unit: string[] } = { pesanan: [], unit: [] };

  /** Catatan terbaru milik pelaku itu, apa pun jenis aksinya. */
  async function jejak(userId: string) {
    const semua = await db
      .select()
      .from(activityLog)
      .where(eq(activityLog.userId, userId))
      .orderBy(desc(activityLog.createdAt));
    for (const r of semua) catatanDibuat.push(r.id);
    return semua;
  }

  it('mencatat pesanan manual yang dibuat, beserta kodenya', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email);

    const hasil = await createManualBooking({
      customerName: 'Uji Jejak',
      phone: `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`,
      serviceType: 'with-driver',
      itemName: 'Innova + sopir',
      startDate: '2099-07-01',
      endDate: '2099-07-03',
      totalPrice: 1000000,
      asalKendaraan: 'sendiri',
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    bersih.pesanan.push(hasil.data.id);

    const [terbaru] = await jejak(akun.id);
    expect(terbaru.action).toBe('pesanan.buat');
    expect(terbaru.summary).toContain(hasil.data.bookingCode);
  });

  it('mencatat perubahan status pesanan', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email);

    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: `LNS-JEJAK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        customerName: 'Uji Status',
        phone: '081234567890',
        serviceType: 'self-drive',
        startDate: '2099-07-01',
      })
      .returning({ id: bookings.id });
    bersih.pesanan.push(row.id);

    await updateBookingStatus(row.id, 'confirmed');

    const [terbaru] = await jejak(akun.id);
    expect(terbaru.action).toBe('pesanan.status');
    expect(terbaru.summary).toMatch(/dikonfirmasi/i);
  });

  // Penghapusan adalah yang paling perlu tercatat: setelah datanya hilang,
  // riwayat inilah satu-satunya keterangan bahwa ia pernah ada.
  it('mencatat penghapusan pesanan lengkap dengan kodenya', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email);

    const kode = `LNS-HAPUS-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: kode,
        customerName: 'Uji Hapus',
        phone: '081234567890',
        serviceType: 'self-drive',
        startDate: '2099-07-01',
      })
      .returning({ id: bookings.id });

    await deleteBooking(row.id);

    const [terbaru] = await jejak(akun.id);
    expect(terbaru.action).toBe('pesanan.hapus');
    expect(terbaru.summary).toContain(kode);
  });

  it('mencatat unit armada yang ditambah dan dihapus', async () => {
    const akun = await buatAkun();
    sebagai(akun.id, akun.email);
    const [model] = await db.select({ id: vehicles.id }).from(vehicles).limit(1);

    const dibuat = await createFleetUnit({ plate: 'B 4321 JEJAK', vehicleId: model.id });
    expect(dibuat.ok).toBe(true);
    if (!dibuat.ok) return;
    bersih.unit.push(dibuat.data.id);

    expect((await jejak(akun.id))[0].action).toBe('unit.buat');

    await deleteFleetUnit(dibuat.data.id);
    expect((await jejak(akun.id))[0].action).toBe('unit.hapus');
  });

  afterAll(async () => {
    for (const id of bersih.pesanan) await db.delete(bookings).where(eq(bookings.id, id));
    for (const id of bersih.unit) await db.delete(fleetUnits).where(eq(fleetUnits.id, id));
  });
});

afterAll(async () => {
  for (const id of akunDibuat) {
    await db.delete(activityLog).where(eq(activityLog.userId, id));
    await db.delete(users).where(eq(users.id, id));
  }
});
