import { describe, it, expect, afterAll } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { bookings, adalahRincianLama } from '@/db/schema';

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];

const kode = (awalan: string) =>
  `LNS-${awalan}-${Date.now().toString(36).slice(-4).toUpperCase()}`;

jalankan('pesanan Fase 1 setelah model harga berubah', () => {
  it('tetap terbaca dan dikenali sebagai rincian lama', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: kode('REGRESI'),
        customerName: 'Pesanan Fase Satu',
        phone: '081234567890',
        serviceType: 'with-driver',
        startDate: '2026-08-01',
        endDate: '2026-08-06',
        rateType: '24h',
        driverDays: 3,
        totalPrice: 4950000,
        priceBreakdown: {
          days: 5,
          ratePerDay: 900000,
          rentalCost: 4500000,
          driverDays: 3,
          driverFeePerDay: 150000,
          driverCost: 450000,
          total: 4950000,
        },
        status: 'confirmed',
      })
      .returning({ id: bookings.id });
    dibuat.push(row.id);

    const [tersimpan] = await db.select().from(bookings).where(eq(bookings.id, row.id));

    expect(tersimpan.priceBreakdown).toBeTruthy();
    expect(adalahRincianLama(tersimpan.priceBreakdown!)).toBe(true);
    expect(tersimpan.totalPrice).toBe(4950000);
    expect(tersimpan.rateCategory).toBeNull();
    expect(tersimpan.rateType).toBe('24h');
  });

  it('pesanan baru memakai bentuk rincian Fase 2', async () => {
    const [row] = await db
      .insert(bookings)
      .values({
        bookingCode: kode('BARU'),
        customerName: 'Pesanan Fase Dua',
        phone: '081234567890',
        serviceType: 'with-driver',
        startDate: '2026-08-15',
        endDate: '2026-08-17',
        rateCategory: 'pelayanan',
        totalPrice: 3000000,
        priceBreakdown: { days: 3, category: 'pelayanan', ratePerDay: 1000000, total: 3000000 },
        status: 'pending',
      })
      .returning({ id: bookings.id });
    dibuat.push(row.id);

    const [tersimpan] = await db.select().from(bookings).where(eq(bookings.id, row.id));
    expect(adalahRincianLama(tersimpan.priceBreakdown!)).toBe(false);
    expect(tersimpan.rateCategory).toBe('pelayanan');
    expect(tersimpan.rateType).toBeNull();
  });

  it('kedua bentuk hidup berdampingan tanpa saling merusak', async () => {
    const semua = await db.select().from(bookings);
    const lama = semua.filter((b) => b.priceBreakdown && adalahRincianLama(b.priceBreakdown));
    const baru = semua.filter((b) => b.priceBreakdown && !adalahRincianLama(b.priceBreakdown));

    expect(lama.length).toBeGreaterThan(0);
    expect(baru.length).toBeGreaterThan(0);

    // Setiap rincian, apa pun bentuknya, wajib punya total yang cocok dengan
    // totalPrice pesanannya — itu janji yang tidak boleh dilanggar model baru.
    for (const b of [...lama, ...baru]) {
      expect(b.priceBreakdown!.total).toBe(b.totalPrice);
    }
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(bookings).where(eq(bookings.id, id));
});
