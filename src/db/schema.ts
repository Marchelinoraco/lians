import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  jsonb,
  date,
  timestamp,
} from 'drizzle-orm/pg-core';
// Impor relatif, bukan alias @/ — drizzle-kit memuat berkas ini lewat esbuild
// tanpa membaca paths di tsconfig, sehingga alias tidak terselesaikan di sana.
import type { Localized } from '../i18n/localized';

export const vehicleCategoryEnum = pgEnum('vehicle_category', [
  'hatchback',
  'sedan',
  'suv',
  'mpv',
  'luxury',
  'bus',
]);
export const transmissionEnum = pgEnum('transmission', ['manual', 'automatic']);
export const fuelTypeEnum = pgEnum('fuel_type', ['petrol', 'diesel', 'electric', 'hybrid']);
export const vehicleStatusEnum = pgEnum('vehicle_status', ['available', 'unavailable']);
export const serviceTypeEnum = pgEnum('service_type', [
  'self-drive',
  'with-driver',
  'tourism',
  'travel',
]);
export const rateTypeEnum = pgEnum('rate_type', ['24h', '12h']);
export const rateCategoryEnum = pgEnum('rate_category', ['lepas-kunci', 'pelayanan']);
export const bookingStatusEnum = pgEnum('booking_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
]);
export const userRoleEnum = pgEnum('user_role', ['admin', 'super_admin']);

export type VehicleImage = { url: string; publicId: string; alt: string };

export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  category: vehicleCategoryEnum('category').notNull(),
  images: jsonb('images').$type<VehicleImage[]>().notNull().default([]),
  // Kolom Fase 1 dipertahankan agar kendaraan lama tetap terbaca; tidak diisi lagi.
  rate24h: integer('rate_24h'),
  rate12h: integer('rate_12h'),
  driverFeeOverride: integer('driver_fee_override'),
  rateLepasKunci: integer('rate_lepas_kunci'),
  ratePelayanan: integer('rate_pelayanan'),
  serviceTypes: jsonb('service_types').$type<string[]>().notNull().default([]),
  seats: integer('seats').notNull(),
  transmission: transmissionEnum('transmission').notNull(),
  fuelType: fuelTypeEnum('fuel_type').notNull(),
  year: integer('year').notNull(),
  luggage: integer('luggage').notNull().default(0),
  features: jsonb('features').$type<Localized<string[]>>().notNull().default({ id: [] }),
  rentalTerms: jsonb('rental_terms').$type<Localized<string[]>>().notNull().default({ id: [] }),
  status: vehicleStatusEnum('status').notNull().default('available'),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const travelRoutes = pgTable('travel_routes', {
  id: uuid('id').primaryKey().defaultRandom(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  price: integer('price'),
  vehicleNote: jsonb('vehicle_note').$type<Localized<string> | null>(),
  estimatedDuration: jsonb('estimated_duration').$type<Localized<string> | null>(),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Bentuk rincian harga Fase 1. Masih tersimpan pada pesanan lama. */
export type PriceBreakdownLama = {
  days: number;
  ratePerDay: number;
  rentalCost: number;
  driverDays: number;
  driverFeePerDay: number;
  driverCost: number;
  total: number;
};

/** Bentuk rincian harga Fase 2. */
export type PriceBreakdownBaru = {
  days: number;
  category: 'lepas-kunci' | 'pelayanan';
  ratePerDay: number;
  total: number;
};

export type PriceBreakdownJson = PriceBreakdownLama | PriceBreakdownBaru;

/** Membedakan keduanya tanpa menebak: hanya bentuk lama punya driverDays. */
export function adalahRincianLama(r: PriceBreakdownJson): r is PriceBreakdownLama {
  return 'driverDays' in r;
}

export const customers = pgTable('customers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  // Disimpan ternormalisasi (62…) supaya 0811… dan +62811… mengenali orang
  // yang sama. Tanpa itu satu pelanggan bisa punya beberapa catatan.
  phone: text('phone').notNull().unique(),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const suppliers = pgTable('suppliers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  phone: text('phone'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const supplierVehicles = pgTable('supplier_vehicles', {
  id: uuid('id').primaryKey().defaultRandom(),
  supplierId: uuid('supplier_id')
    .notNull()
    .references(() => suppliers.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: uuid('id').primaryKey().defaultRandom(),
  bookingCode: text('booking_code').notNull().unique(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  // Boleh kosong: pesanan Fase 1 dibuat sebelum tabel pelanggan ada. Nama dan
  // telepon tetap disalin ke pesanan, jadi tautan yang hilang tidak merusak
  // riwayat — alasannya sama dengan salinan harga.
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  serviceType: serviceTypeEnum('service_type').notNull(),
  vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
  routeId: uuid('route_id').references(() => travelRoutes.id, { onDelete: 'set null' }),
  // Hanya terisi pada booking manual: pesanan dari situs selalu memakai armada
  // LIANS sendiri, karena hanya kendaraan itu yang tayang di katalog publik.
  supplierVehicleId: uuid('supplier_vehicle_id').references(() => supplierVehicles.id, {
    onDelete: 'set null',
  }),
  supplierNameSnapshot: text('supplier_name_snapshot'),
  // TOTAL yang LIANS bayar ke pemasok untuk pesanan ini — bukan per hari, dan
  // terpisah dari totalPrice yang dibayar pelanggan. Selisihnya adalah margin.
  supplierCost: integer('supplier_cost'),
  supplierPaid: boolean('supplier_paid').notNull().default(false),
  vehicleNameSnapshot: text('vehicle_name_snapshot'),
  routeNameSnapshot: text('route_name_snapshot'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  rateType: rateTypeEnum('rate_type'),
  rateCategory: rateCategoryEnum('rate_category'),
  driverDays: integer('driver_days').notNull().default(0),
  totalPrice: integer('total_price'),
  priceBreakdown: jsonb('price_breakdown').$type<PriceBreakdownJson | null>(),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const testimonials = pgTable('testimonials', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerName: text('customer_name').notNull(),
  rating: integer('rating').notNull(),
  reviewText: jsonb('review_text').$type<Localized<string>>().notNull(),
  vehicleName: text('vehicle_name'),
  date: date('date').notNull(),
  isFeatured: boolean('is_featured').notNull().default(false),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const siteSettings = pgTable('site_settings', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('admin'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rateLimits = pgTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull().default(0),
  windowStart: timestamp('window_start', { withTimezone: true }).notNull().defaultNow(),
});

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
export type TravelRoute = typeof travelRoutes.$inferSelect;
export type NewTravelRoute = typeof travelRoutes.$inferInsert;
export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierVehicle = typeof supplierVehicles.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type User = typeof users.$inferSelect;
