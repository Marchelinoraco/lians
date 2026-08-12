import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { vehicles, bookings, travelRoutes, adalahRincianLama } from '@/db/schema';

const kolom = (t: Parameters<typeof getTableConfig>[0]) =>
  Object.fromEntries(getTableConfig(t).columns.map((c) => [c.name, c]));

describe('skema vehicles', () => {
  it('kedua tarif kategori boleh kosong secara terpisah', () => {
    const c = kolom(vehicles);
    expect(c['rate_lepas_kunci'].notNull).toBe(false);
    expect(c['rate_pelayanan'].notNull).toBe(false);
  });

  it('memisahkan status dari is_published', () => {
    const c = kolom(vehicles);
    expect(c['status']).toBeDefined();
    expect(c['is_published']).toBeDefined();
  });
});

describe('skema bookings', () => {
  it('end_date, rate_type, dan total_price boleh kosong untuk pesanan travel', () => {
    const c = kolom(bookings);
    expect(c['end_date'].notNull).toBe(false);
    expect(c['rate_type'].notNull).toBe(false);
    expect(c['total_price'].notNull).toBe(false);
  });

  it('start_date dan booking_code wajib', () => {
    const c = kolom(bookings);
    expect(c['start_date'].notNull).toBe(true);
    expect(c['booking_code'].notNull).toBe(true);
  });
});

describe('skema travel_routes', () => {
  it('price boleh kosong agar rute bisa ditambah sebelum bertarif', () => {
    expect(kolom(travelRoutes)['price'].notNull).toBe(false);
  });
});

describe('kolom yang dapat diterjemahkan', () => {
  it('features dan rental_terms disimpan sebagai jsonb, bukan array datar', () => {
    const c = kolom(vehicles);
    expect(c['features'].dataType).toBe('json');
    expect(c['rental_terms'].dataType).toBe('json');
  });

  it('nilai bawaan features memuat kunci bahasa Indonesia', () => {
    expect(kolom(vehicles)['features'].default).toEqual({ id: [] });
  });

  it('catatan kendaraan dan waktu tempuh rute disimpan sebagai jsonb', () => {
    const c = kolom(travelRoutes);
    expect(c['vehicle_note'].dataType).toBe('json');
    expect(c['estimated_duration'].dataType).toBe('json');
  });
});

describe('kolom tarif dua kategori', () => {
  it('menyediakan kolom tarif lepas kunci dan pelayanan', () => {
    const c = kolom(vehicles);
    expect(c['rate_lepas_kunci']).toBeDefined();
    expect(c['rate_pelayanan']).toBeDefined();
  });

  it('membiarkan kolom tarif lama tetap ada demi kendaraan Fase 1', () => {
    const c = kolom(vehicles);
    expect(c['rate_24h']).toBeDefined();
    expect(c['rate_24h'].notNull).toBe(false);
  });

  it('menyediakan kolom kategori pada pesanan', () => {
    expect(kolom(bookings)['rate_category']).toBeDefined();
  });
});

describe('adalahRincianLama', () => {
  it('mengenali rincian Fase 1 dari adanya driverDays', () => {
    expect(
      adalahRincianLama({
        days: 5,
        ratePerDay: 900000,
        rentalCost: 4500000,
        driverDays: 3,
        driverFeePerDay: 150000,
        driverCost: 450000,
        total: 4950000,
      }),
    ).toBe(true);
  });

  it('mengenali rincian Fase 2', () => {
    expect(
      adalahRincianLama({ days: 3, category: 'pelayanan', ratePerDay: 1000000, total: 3000000 }),
    ).toBe(false);
  });
});
