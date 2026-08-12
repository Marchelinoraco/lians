import { describe, it, expect } from 'vitest';
import { bookingInputSchema } from '@/schemas/booking';

const sewaValid = {
  customerName: 'Budi Santoso',
  phone: '081234567890',
  email: 'budi@example.com',
  serviceType: 'with-driver' as const,
  vehicleId: '11111111-1111-4111-8111-111111111111',
  startDate: '2099-08-15',
  endDate: '2099-08-17',
  rateCategory: 'pelayanan' as const,
  notes: '',
};

const travelValid = {
  customerName: 'Sari',
  phone: '+6281234567890',
  serviceType: 'travel' as const,
  routeId: '22222222-2222-4222-8222-222222222222',
  startDate: '2099-08-01',
};

describe('bookingInputSchema — sewa kendaraan', () => {
  it('menerima pesanan sewa yang lengkap', () => {
    expect(bookingInputSchema.safeParse(sewaValid).success).toBe(true);
  });

  it('menolak pesanan sewa tanpa kategori tarif', () => {
    const { rateCategory: _abaikan, ...tanpaKategori } = sewaValid;
    expect(bookingInputSchema.safeParse(tanpaKategori).success).toBe(false);
  });

  it('menolak kategori tarif yang tidak dikenal', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, rateCategory: 'gratis' });
    expect(r.success).toBe(false);
  });

  it('menerima tanggal mulai sama dengan tanggal selesai', () => {
    const r = bookingInputSchema.safeParse({
      ...sewaValid,
      startDate: '2099-08-15',
      endDate: '2099-08-15',
    });
    expect(r.success).toBe(true);
  });

  it('menolak tanggal selesai sebelum tanggal mulai', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, endDate: '2099-08-14' });
    expect(r.success).toBe(false);
  });

  it('menolak tanggal mulai di masa lalu', () => {
    const r = bookingInputSchema.safeParse({
      ...sewaValid,
      startDate: '2020-01-01',
      endDate: '2020-01-03',
    });
    expect(r.success).toBe(false);
  });

  it('menolak sewa tanpa vehicleId', () => {
    const { vehicleId: _abaikan, ...tanpaMobil } = sewaValid;
    expect(bookingInputSchema.safeParse(tanpaMobil).success).toBe(false);
  });

  it('menolak nomor telepon bukan format Indonesia', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, phone: '12345' });
    expect(r.success).toBe(false);
  });

  it('menerima email kosong karena email opsional', () => {
    const r = bookingInputSchema.safeParse({ ...sewaValid, email: '' });
    expect(r.success).toBe(true);
  });
});

describe('bookingInputSchema — travel', () => {
  it('menerima pesanan travel tanpa endDate dan rateType', () => {
    expect(bookingInputSchema.safeParse(travelValid).success).toBe(true);
  });

  it('menolak pesanan travel yang membawa kategori tarif', () => {
    const r = bookingInputSchema.safeParse({ ...travelValid, rateCategory: 'pelayanan' });
    expect(r.success).toBe(false);
  });

  it('menolak pesanan travel tanpa routeId', () => {
    const { routeId: _abaikan, ...tanpaRute } = travelValid;
    expect(bookingInputSchema.safeParse(tanpaRute).success).toBe(false);
  });
});
