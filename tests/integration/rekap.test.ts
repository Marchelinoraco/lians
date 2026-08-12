import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { bookings } = await import('@/db/schema');
const { hitungRekap } = await import('@/queries/rekap');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const superAdmin = () =>
  authMock.mockResolvedValue({ user: { id: 'uji', email: 'bos@lians.id', role: 'super_admin' } });

// Acak, bukan berbasis waktu: beberapa pesanan dibuat dalam milidetik yang sama
// di dalam satu tes, dan bookingCode punya batasan unik.
const kode = () => `LNS-REKAP-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

async function buatPesanan(over: Partial<typeof bookings.$inferInsert>) {
  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode: kode(),
      customerName: 'Uji Rekap',
      phone: '081234567890',
      serviceType: 'self-drive',
      startDate: '2099-09-01',
      status: 'confirmed',
      ...over,
    })
    .returning({ id: bookings.id });
  dibuat.push(row.id);
  return row.id;
}

jalankan('hitungRekap', () => {
  const dari = new Date(Date.now() - 60 * 60 * 1000);
  const sampai = new Date(Date.now() + 60 * 60 * 1000);

  it('menolak admin biasa, bukan hanya menyembunyikan menunya', async () => {
    authMock.mockResolvedValue({ user: { id: 'staf', email: 'staf@lians.id', role: 'admin' } });
    await expect(hitungRekap(dari, sampai)).rejects.toThrow(/sesi tidak valid/i);
  });

  it('menolak permintaan tanpa sesi sama sekali', async () => {
    authMock.mockResolvedValue(null);
    await expect(hitungRekap(dari, sampai)).rejects.toThrow(/sesi tidak valid/i);
  });

  it('menghitung pendapatan hanya dari pesanan terkonfirmasi dan selesai', async () => {
    superAdmin();
    const sebelum = await hitungRekap(dari, sampai);

    await buatPesanan({ totalPrice: 500000, status: 'confirmed', source: 'website' });
    await buatPesanan({ totalPrice: 300000, status: 'completed', source: 'manual' });
    await buatPesanan({ totalPrice: 900000, status: 'pending', source: 'website' });
    await buatPesanan({ totalPrice: 700000, status: 'cancelled', source: 'website' });

    const sesudah = await hitungRekap(dari, sampai);

    // Hanya 500rb + 300rb yang dihitung; pending dan cancelled diabaikan.
    expect(sesudah.pendapatan - sebelum.pendapatan).toBe(800000);
    expect(sesudah.jumlahPesanan - sebelum.jumlahPesanan).toBe(2);
    expect(sesudah.jumlahWebsite - sebelum.jumlahWebsite).toBe(1);
    expect(sesudah.jumlahManual - sebelum.jumlahManual).toBe(1);
  });

  it('menghitung margin sebagai pendapatan dikurangi biaya pemasok', async () => {
    superAdmin();
    const sebelum = await hitungRekap(dari, sampai);

    await buatPesanan({
      totalPrice: 1000000,
      supplierCost: 600000,
      supplierPaid: false,
      status: 'confirmed',
      source: 'manual',
    });

    const sesudah = await hitungRekap(dari, sampai);

    expect(sesudah.biayaPemasok - sebelum.biayaPemasok).toBe(600000);
    expect(sesudah.margin - sebelum.margin).toBe(400000);
    expect(sesudah.utangBelumLunas - sebelum.utangBelumLunas).toBe(600000);
  });

  it('tidak menghitung pesanan di luar rentang tanggal', async () => {
    superAdmin();
    const rekap = await hitungRekap(new Date('2000-01-01'), new Date('2000-01-31'));
    expect(rekap.jumlahPesanan).toBe(0);
    expect(rekap.pendapatan).toBe(0);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(bookings).where(eq(bookings.id, id));
});
