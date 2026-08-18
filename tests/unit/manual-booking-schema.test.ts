import { describe, expect, it } from 'vitest';
import { manualBookingInputSchema } from '@/schemas/manual-booking';

const sah = {
  customerName: 'Grace Tumbelaka',
  phone: '081234567890',
  serviceType: 'with-driver' as const,
  itemName: 'Innova Zenix + sopir, 3 hari',
  startDate: '2026-09-01',
  totalPrice: 3600000,
  asalKendaraan: 'sendiri' as const,
};

describe('skema booking manual — biaya operasional', () => {
  it('menerima pesanan tanpa satu pun pos biaya', () => {
    expect(manualBookingInputSchema.safeParse(sah).success).toBe(true);
  });

  it('menerima keempat pos biaya sekaligus', () => {
    const hasil = manualBookingInputSchema.safeParse({
      ...sah,
      costFuel: 400000,
      costDriver: 250000,
      costTollParking: 75000,
      costOther: 25000,
      costOtherNote: 'Cuci mobil dan parkir inap',
    });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.costFuel).toBe(400000);
  });

  // Form mengirim string kosong untuk kolom angka yang tidak diisi. Tanpa ini,
  // admin yang hanya mengisi BBM akan ditolak karena tiga pos lainnya kosong.
  it('memperlakukan kolom biaya yang dikosongkan sebagai tidak diisi', () => {
    const hasil = manualBookingInputSchema.safeParse({
      ...sah,
      costFuel: 400000,
      costDriver: '',
      costTollParking: '',
      costOther: '',
    });
    expect(hasil.success).toBe(true);
  });

  it('menolak biaya operasional bernilai minus', () => {
    const hasil = manualBookingInputSchema.safeParse({ ...sah, costFuel: -1 });
    expect(hasil.success).toBe(false);
  });

  it('menolak keterangan pos lain-lain yang kelewat panjang', () => {
    const hasil = manualBookingInputSchema.safeParse({ ...sah, costOtherNote: 'x'.repeat(201) });
    expect(hasil.success).toBe(false);
  });
});
