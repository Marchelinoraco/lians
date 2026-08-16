import { describe, expect, it } from 'vitest';
import {
  manualTourRequestSchema,
  manualTicketRequestSchema,
} from '@/schemas/manual-permintaan';
import { tourRequestSchema } from '@/schemas/tour-request';
import { ticketRequestSchema } from '@/schemas/ticket-request';
import { TOUR_SLUGS } from '@/data/tours';

const turSah = {
  tourSlug: TOUR_SLUGS[0],
  customerName: 'Grace Tumbelaka',
  phone: '081234567890',
  pax: 4,
  startDate: '2026-09-01',
};

const tiketSah = {
  origin: 'Manado',
  destination: 'Jakarta',
  departureDate: '2026-09-10',
  pax: 2,
  customerName: 'Denny Wowor',
  phone: '081299887766',
};

describe('skema permintaan manual', () => {
  it('menerima isian minimum dan memberi status menunggu', () => {
    const tur = manualTourRequestSchema.safeParse(turSah);
    expect(tur.success).toBe(true);
    // Berbeda dari booking manual yang langsung 'confirmed': permintaan adalah
    // permintaan penawaran, harganya belum tentu disepakati saat ditelepon.
    if (tur.success) expect(tur.data.status).toBe('pending');

    const tiket = manualTicketRequestSchema.safeParse(tiketSah);
    expect(tiket.success).toBe(true);
    if (tiket.success) expect(tiket.data.status).toBe('pending');
  });

  it('menerima status lain bila permintaannya sudah disepakati saat ditelepon', () => {
    const hasil = manualTourRequestSchema.safeParse({ ...turSah, status: 'confirmed' });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.status).toBe('confirmed');
  });

  it('menolak status di luar daftar', () => {
    expect(manualTourRequestSchema.safeParse({ ...turSah, status: 'lunas' }).success).toBe(false);
  });

  it('menerima catatan internal yang tidak ada di form publik', () => {
    const hasil = manualTicketRequestSchema.safeParse({
      ...tiketSah,
      adminNotes: 'Minta harga rombongan, tunggu balasan maskapai.',
    });
    expect(hasil.success).toBe(true);
    if (hasil.success) expect(hasil.data.adminNotes).toContain('rombongan');
  });
});

/**
 * Inti dari pemisahan bidang: satu perbaikan aturan harus berlaku di kedua
 * jalur. Uji ini gagal begitu ada yang menyalin aturannya alih-alih memakai
 * bidang yang sama.
 */
describe('aturan yang sama dengan form publik', () => {
  const nomorSalah = ['08123', '12345678901', 'abcdefghijk', '+1 555 0100'];

  it.each(nomorSalah)('menolak nomor "%s" di kedua jalur', (phone) => {
    expect(tourRequestSchema.safeParse({ ...turSah, phone }).success).toBe(false);
    expect(manualTourRequestSchema.safeParse({ ...turSah, phone }).success).toBe(false);
  });

  it('menolak paket di luar daftar statis, juga saat dicatat staf', () => {
    const input = { ...turSah, tourSlug: 'paket-yang-tidak-ada' };
    expect(tourRequestSchema.safeParse(input).success).toBe(false);
    expect(manualTourRequestSchema.safeParse(input).success).toBe(false);
  });

  it('menolak tanggal selesai yang mendahului tanggal mulai', () => {
    const input = { ...turSah, startDate: '2026-09-10', endDate: '2026-09-01' };
    expect(tourRequestSchema.safeParse(input).success).toBe(false);
    expect(manualTourRequestSchema.safeParse(input).success).toBe(false);
  });

  it('menolak kota asal dan tujuan yang sama', () => {
    const input = { ...tiketSah, destination: 'manado' };
    expect(ticketRequestSchema.safeParse(input).success).toBe(false);
    expect(manualTicketRequestSchema.safeParse(input).success).toBe(false);
  });

  it('menolak maskapai yang tidak dikenal', () => {
    const input = { ...tiketSah, airline: 'maskapai-karangan' };
    expect(ticketRequestSchema.safeParse(input).success).toBe(false);
    expect(manualTicketRequestSchema.safeParse(input).success).toBe(false);
  });

  it('menerima maskapai kosong — belum menentukan itu jawaban yang sah', () => {
    expect(manualTicketRequestSchema.safeParse({ ...tiketSah, airline: '' }).success).toBe(true);
  });

  it('menolak jumlah peserta di luar batas rombongan', () => {
    expect(manualTourRequestSchema.safeParse({ ...turSah, pax: 0 }).success).toBe(false);
    expect(manualTourRequestSchema.safeParse({ ...turSah, pax: 61 }).success).toBe(false);
  });
});
