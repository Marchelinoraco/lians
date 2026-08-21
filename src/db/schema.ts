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
  unique,
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
export const bookingSourceEnum = pgEnum('booking_source', ['website', 'manual']);

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
  // Unit fisik yang dipakai, bila kendaraannya milik LIANS. Inilah yang
  // dibandingkan saat memeriksa bentrok tanggal; vehicleId hanya menyebut
  // modelnya, dan tiga mobil sejenis tidak dapat dibedakan darinya.
  fleetUnitId: uuid('fleet_unit_id'),
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
  // Biaya operasional: yang keluar dari kantong LIANS untuk menjalankan
  // pesanan ini. Berlaku juga saat kendaraannya dari pemasok — BBM, sopir, dan
  // tol tetap tanggungan LIANS meski mobilnya pinjaman.
  //
  // Nullable, bukan default 0: pesanan yang biayanya belum sempat dicatat harus
  // dapat dibedakan dari pesanan yang biayanya memang nihil.
  costFuel: integer('cost_fuel'),
  costDriver: integer('cost_driver'),
  costTollParking: integer('cost_toll_parking'),
  costOther: integer('cost_other'),
  costOtherNote: text('cost_other_note'),
  vehicleNameSnapshot: text('vehicle_name_snapshot'),
  routeNameSnapshot: text('route_name_snapshot'),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  rateType: rateTypeEnum('rate_type'),
  rateCategory: rateCategoryEnum('rate_category'),
  driverDays: integer('driver_days').notNull().default(0),
  totalPrice: integer('total_price'),
  priceBreakdown: jsonb('price_breakdown').$type<PriceBreakdownJson | null>(),
  // Terisi saat admin mengubah total harga pesanan yang datang dari situs.
  // Rincian otomatisnya sengaja tidak dihapus: yang hilang bukan hanya angka,
  // tetapi jejak harga yang pernah dilihat dan disetujui pelanggan.
  priceEditedAt: timestamp('price_edited_at', { withTimezone: true }),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  // Memisahkan pesanan yang masuk lewat situs dari yang dicatat staf lewat
  // telepon atau tatap muka, supaya rekap dapat membedakan keduanya.
  source: bookingSourceEnum('source').notNull().default('website'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Riwayat perubahan data oleh staf.
 *
 * Setiap Server Action yang mengubah data menuliskan satu baris di sini.
 * Tanpanya, pertanyaan "siapa yang menghapus pesanan itu" tidak punya jawaban
 * sama sekali — dan pada sistem yang dipakai bersama-sama, pertanyaan itu
 * selalu datang setelah kerusakannya terjadi, bukan sebelumnya.
 *
 * Tidak ada aksi yang menyunting atau menghapus baris di sini. Riwayat yang
 * dapat dirapikan pelakunya sendiri bukan riwayat.
 */
export const activityLog = pgTable('activity_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  // Email disalin: akun yang kelak dihapus tidak boleh membuat seluruh
  // riwayatnya kehilangan keterangan siapa pelakunya.
  userEmailSnapshot: text('user_email_snapshot').notNull(),
  /** Slug bertingkat seperti "pesanan.buat", untuk menyaring per jenis. */
  action: text('action').notNull(),
  summary: text('summary').notNull(),
  entity: text('entity'),
  // Teks, bukan uuid: sebagian entitas dikenali lewat slug atau kunci
  // pengaturan, dan riwayat tidak boleh gagal ditulis karena bentuk id-nya.
  entityId: text('entity_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Kendaraan fisik milik LIANS, satu baris per nomor polisi.
 *
 * Berbeda dari tabel `vehicles`, yang berisi MODEL untuk katalog publik: satu
 * baris "Innova Zenix G" di sana mewakili tiga mobil sungguhan di sini. Tanpa
 * pemisahan itu, tidak ada yang dapat menjawab apakah unit ketiga masih bebas
 * pada tanggal tertentu.
 *
 * Nomor polisi TIDAK unik sendirian, melainkan unik per model. Pemiliknya
 * menegaskan ada dua kendaraan berbeda dengan nomor tercatat sama; batasan
 * ini tetap menangkap satu unit yang tanpa sengaja dimasukkan dua kali pada
 * model yang sama, tanpa menolak data yang dinyatakan benar.
 */
export const fleetUnits = pgTable(
  'fleet_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    plate: text('plate').notNull(),
    vehicleId: uuid('vehicle_id').references(() => vehicles.id, { onDelete: 'set null' }),
    // Nama model disalin: model yang kelak dihapus dari katalog tidak boleh
    // membuat unit fisiknya kehilangan keterangan ia mobil apa.
    vehicleNameSnapshot: text('vehicle_name_snapshot').notNull(),
    notes: text('notes'),
    // Unit yang dijual atau sedang lama di bengkel dinonaktifkan, bukan
    // dihapus: pesanan lama yang memakainya harus tetap terbaca.
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique('fleet_units_plate_vehicle').on(t.plate, t.vehicleId)],
);

/**
 * Permintaan penawaran tur. Paketnya statis di dalam repo, tetapi permintaan
 * yang masuk adalah pesanan — bukan konten — sehingga tetap tersimpan.
 */
export const tourRequests = pgTable('tour_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestCode: text('request_code').notNull().unique(),
  // Slug, bukan foreign key: tidak ada tabel paket yang bisa dirujuk. Namanya
  // disalin di kolom berikutnya supaya mengganti judul paket kelak tidak
  // mengubah isi permintaan lama.
  tourSlug: text('tour_slug').notNull(),
  tourNameSnapshot: text('tour_name_snapshot').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  pax: integer('pax').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  // Sama seperti pesanan: tanpa kolom ini, staf tidak dapat membedakan
  // permintaan yang masuk sendiri lewat situs dari yang mereka ketik sendiri
  // setelah menerima telepon — dan keduanya butuh tindak lanjut berbeda.
  source: bookingSourceEnum('source').notNull().default('website'),
  adminNotes: text('admin_notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Permintaan pemesanan tiket pesawat.
 *
 * Tidak ada kolom harga sama sekali, dan itu disengaja: tarif penerbangan
 * berubah setiap jam dan bergantung ketersediaan kelas. Harga disepakati lewat
 * WhatsApp saat penawaran dibuat, bukan disimpan lalu jadi basi.
 */
export const ticketRequests = pgTable('ticket_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  requestCode: text('request_code').notNull().unique(),
  origin: text('origin').notNull(),
  destination: text('destination').notNull(),
  // Boleh kosong: pelanggan yang belum menentukan maskapai justru yang paling
  // butuh dibantu memilih.
  airline: text('airline'),
  departureDate: date('departure_date').notNull(),
  returnDate: date('return_date'),
  pax: integer('pax').notNull(),
  customerName: text('customer_name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
  notes: text('notes'),
  status: bookingStatusEnum('status').notNull().default('pending'),
  // Sama seperti pesanan: tanpa kolom ini, staf tidak dapat membedakan
  // permintaan yang masuk sendiri lewat situs dari yang mereka ketik sendiri
  // setelah menerima telepon — dan keduanya butuh tindak lanjut berbeda.
  source: bookingSourceEnum('source').notNull().default('website'),
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

export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  slug: text('slug').notNull().unique(),
  title: jsonb('title').$type<Localized<string>>().notNull(),
  excerpt: jsonb('excerpt').$type<Localized<string>>().notNull().default({ id: '' }),
  // Larik baris, bukan satu teks panjang: bentuk ini dapat memakai
  // LocalizedListInput yang sudah ada, tanpa widget baru dan tanpa Markdown.
  body: jsonb('body').$type<Localized<string[]>>().notNull().default({ id: [] }),
  coverImage: jsonb('cover_image').$type<VehicleImage[]>().notNull().default([]),
  // Berbawaan false, kebalikan dari kendaraan. Artikel setengah jadi yang tidak
  // sengaja tayang lebih merugikan daripada artikel selesai yang lupa
  // diterbitkan.
  isPublished: boolean('is_published').notNull().default(false),
  // Dipisah dari createdAt: artikel boleh disiapkan lebih dulu lalu diterbitkan
  // kemudian, dan yang tampil di situs adalah tanggal ini.
  publishedAt: date('published_at').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const galleryItems = pgTable('gallery_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  image: jsonb('image').$type<VehicleImage[]>().notNull().default([]),
  caption: jsonb('caption').$type<Localized<string>>().notNull().default({ id: '' }),
  isPublished: boolean('is_published').notNull().default(true),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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
export type TourRequest = typeof tourRequests.$inferSelect;
export type NewTourRequest = typeof tourRequests.$inferInsert;
export type TicketRequest = typeof ticketRequests.$inferSelect;
export type NewTicketRequest = typeof ticketRequests.$inferInsert;
export type Supplier = typeof suppliers.$inferSelect;
export type NewSupplier = typeof suppliers.$inferInsert;
export type SupplierVehicle = typeof supplierVehicles.$inferSelect;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type GalleryItem = typeof galleryItems.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type NewTestimonial = typeof testimonials.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type User = typeof users.$inferSelect;
