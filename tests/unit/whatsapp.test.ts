import { describe, it, expect } from 'vitest';
import { buildBookingMessage, normalizePhone, waLink } from '@/lib/whatsapp';

describe('normalizePhone', () => {
  it('mengubah awalan 0 menjadi 62', () => {
    expect(normalizePhone('081234567890')).toBe('6281234567890');
  });

  it('membuang tanda plus dan spasi', () => {
    expect(normalizePhone('+62 812-3456-7890')).toBe('6281234567890');
  });

  it('membiarkan nomor yang sudah diawali 62', () => {
    expect(normalizePhone('6281234567890')).toBe('6281234567890');
  });
});

describe('buildBookingMessage', () => {
  const sewa = {
    bookingCode: 'LNS-20260810-A7K2',
    customerName: 'Budi Santoso',
    itemName: 'Innova Zenix G',
    startDate: '2026-08-01',
    endDate: '2026-08-06',
    rateType: '24h' as const,
    days: 5,
    driverDays: 3,
    totalPrice: 3950000,
    notes: 'Jemput di bandara',
  };

  it('menyertakan kode booking', () => {
    expect(buildBookingMessage(sewa)).toContain('LNS-20260810-A7K2');
  });

  it('menyertakan nama kendaraan dan total dalam rupiah', () => {
    const pesan = buildBookingMessage(sewa);
    expect(pesan).toContain('Innova Zenix G');
    expect(pesan).toContain('Rp 3.950.000');
  });

  it('menjelaskan jumlah hari sewa dan hari pakai sopir', () => {
    const pesan = buildBookingMessage(sewa);
    expect(pesan).toContain('5 hari');
    expect(pesan).toContain('3 hari');
  });

  it('menyertakan catatan customer bila ada', () => {
    expect(buildBookingMessage(sewa)).toContain('Jemput di bandara');
  });

  it('menyebut menunggu penawaran bila total belum ditetapkan', () => {
    const pesan = buildBookingMessage({
      bookingCode: 'LNS-20260810-B3M9',
      customerName: 'Sari',
      itemName: 'Manado → Likupang',
      startDate: '2026-08-01',
      driverDays: 0,
      totalPrice: null,
    });
    expect(pesan).toMatch(/menunggu penawaran harga/i);
    expect(pesan).not.toContain('Rp');
  });

  it('tidak menyebut sopir bila hari sopir nol', () => {
    const pesan = buildBookingMessage({ ...sewa, driverDays: 0 });
    expect(pesan).not.toMatch(/sopir/i);
  });

  it('selalu berbahasa Indonesia karena yang membacanya staf LIANS', () => {
    const pesan = buildBookingMessage(sewa);
    expect(pesan).toContain('Halo LIANS');
    expect(pesan).toContain('1 Agustus 2026');
  });
});

describe('waLink', () => {
  it('menyandikan pesan ke dalam URL', () => {
    const url = waLink('081234567890', 'Halo LIANS & terima kasih');
    expect(url).toContain('wa.me/6281234567890?text=');
    expect(decodeURIComponent(url)).toContain('Halo LIANS & terima kasih');
  });
});
