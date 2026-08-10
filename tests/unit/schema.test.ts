import { describe, it, expect } from 'vitest';
import { getTableConfig } from 'drizzle-orm/pg-core';
import { vehicles, bookings, travelRoutes } from '@/db/schema';

const kolom = (t: Parameters<typeof getTableConfig>[0]) =>
  Object.fromEntries(getTableConfig(t).columns.map((c) => [c.name, c]));

describe('skema vehicles', () => {
  it('rate_24h wajib, rate_12h boleh kosong', () => {
    const c = kolom(vehicles);
    expect(c['rate_24h'].notNull).toBe(true);
    expect(c['rate_12h'].notNull).toBe(false);
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
