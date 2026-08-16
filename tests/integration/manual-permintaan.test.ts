import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { tourRequests, ticketRequests, customers } = await import('@/db/schema');
const { createManualTourRequest, createManualTicketRequest } = await import(
  '@/actions/admin-manual-permintaan'
);
const { TOUR_PACKAGES } = await import('@/data/tours');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;

const turDibuat: string[] = [];
const tiketDibuat: string[] = [];
const pelangganDibuat = new Set<string>();

const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });
const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;
const paket = TOUR_PACKAGES[0];

/** Mencatat permintaan sekaligus pelanggan yang lahir darinya, agar ikut dibersihkan. */
async function catatTur(id: string) {
  turDibuat.push(id);
  const [row] = await db
    .select({ customerId: tourRequests.customerId })
    .from(tourRequests)
    .where(eq(tourRequests.id, id));
  if (row?.customerId) pelangganDibuat.add(row.customerId);
}

async function catatTiket(id: string) {
  tiketDibuat.push(id);
  const [row] = await db
    .select({ customerId: ticketRequests.customerId })
    .from(ticketRequests)
    .where(eq(ticketRequests.id, id));
  if (row?.customerId) pelangganDibuat.add(row.customerId);
}

jalankan('permintaan tur manual', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const hasil = await createManualTourRequest({
      tourSlug: paket.slug,
      customerName: 'Tak Boleh',
      phone: nomorUji(),
      pax: 2,
      startDate: '2099-09-01',
    });
    expect(hasil.ok).toBe(false);
  });

  it('menyimpan dengan asal manual dan status menunggu', async () => {
    bersesi();
    const hasil = await createManualTourRequest({
      tourSlug: paket.slug,
      customerName: 'Grace Uji',
      phone: nomorUji(),
      pax: 4,
      startDate: '2099-09-01',
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catatTur(hasil.data.id);

    const [row] = await db.select().from(tourRequests).where(eq(tourRequests.id, hasil.data.id));
    expect(row.source).toBe('manual');
    expect(row.status).toBe('pending');
    // Namanya diambil dari data paket, bukan dari kiriman form.
    expect(row.tourNameSnapshot).toBe(paket.name.id);
  });

  it('menormalkan nomor telepon, supaya pelanggan yang sama tidak tercatat dua kali', async () => {
    bersesi();
    const nomor = nomorUji();

    const pertama = await createManualTourRequest({
      tourSlug: paket.slug,
      customerName: 'Denny Uji',
      phone: nomor,
      pax: 2,
      startDate: '2099-09-01',
    });
    expect(pertama.ok).toBe(true);
    if (!pertama.ok) return;
    await catatTur(pertama.data.id);

    // Nomor yang sama ditulis dengan awalan +62 — orang yang sama.
    const kedua = await createManualTourRequest({
      tourSlug: paket.slug,
      customerName: 'Denny Uji',
      phone: `+62${nomor.slice(1)}`,
      pax: 3,
      startDate: '2099-10-01',
    });
    expect(kedua.ok).toBe(true);
    if (!kedua.ok) return;
    await catatTur(kedua.data.id);

    const baris = await db
      .select({ phone: tourRequests.phone, customerId: tourRequests.customerId })
      .from(tourRequests)
      .where(inArray(tourRequests.id, [pertama.data.id, kedua.data.id]));

    expect(baris[0].phone).toBe(baris[1].phone);
    expect(baris[0].customerId).toBe(baris[1].customerId);
  });

  it('menerima status yang dipilih staf saat permintaannya sudah disepakati', async () => {
    bersesi();
    const hasil = await createManualTourRequest({
      tourSlug: paket.slug,
      customerName: 'Sudah Sepakat',
      phone: nomorUji(),
      pax: 2,
      startDate: '2099-09-01',
      status: 'confirmed',
      adminNotes: 'Sudah deal lewat telepon.',
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catatTur(hasil.data.id);

    const [row] = await db.select().from(tourRequests).where(eq(tourRequests.id, hasil.data.id));
    expect(row.status).toBe('confirmed');
    expect(row.adminNotes).toContain('telepon');
  });

  it('menolak paket yang tidak ada di daftar statis', async () => {
    bersesi();
    const hasil = await createManualTourRequest({
      tourSlug: 'paket-karangan',
      customerName: 'Tidak Sah',
      phone: nomorUji(),
      pax: 2,
      startDate: '2099-09-01',
    });
    expect(hasil.ok).toBe(false);
  });
});

jalankan('permintaan tiket manual', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const hasil = await createManualTicketRequest({
      origin: 'Manado',
      destination: 'Jakarta',
      departureDate: '2099-09-01',
      pax: 1,
      customerName: 'Tak Boleh',
      phone: nomorUji(),
    });
    expect(hasil.ok).toBe(false);
  });

  it('menyimpan dengan asal manual', async () => {
    bersesi();
    const hasil = await createManualTicketRequest({
      origin: 'Manado',
      destination: 'Surabaya',
      airline: 'garuda',
      departureDate: '2099-09-01',
      pax: 2,
      customerName: 'Fitri Uji',
      phone: nomorUji(),
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catatTiket(hasil.data.id);

    const [row] = await db
      .select()
      .from(ticketRequests)
      .where(eq(ticketRequests.id, hasil.data.id));
    expect(row.source).toBe('manual');
    expect(row.airline).toBe('garuda');
  });

  it('menyimpan maskapai kosong sebagai null, bukan string kosong', async () => {
    bersesi();
    const hasil = await createManualTicketRequest({
      origin: 'Manado',
      destination: 'Denpasar',
      airline: '',
      departureDate: '2099-09-01',
      pax: 1,
      customerName: 'Belum Pilih',
      phone: nomorUji(),
    });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catatTiket(hasil.data.id);

    const [row] = await db
      .select()
      .from(ticketRequests)
      .where(eq(ticketRequests.id, hasil.data.id));
    expect(row.airline).toBeNull();
  });

  it('menolak kota asal dan tujuan yang sama', async () => {
    bersesi();
    const hasil = await createManualTicketRequest({
      origin: 'Manado',
      destination: 'manado',
      departureDate: '2099-09-01',
      pax: 1,
      customerName: 'Salah Ketik',
      phone: nomorUji(),
    });
    expect(hasil.ok).toBe(false);
  });
});

afterAll(async () => {
  // Basis data ini dipakai sungguhan; apa pun yang dibuat uji harus hilang.
  if (turDibuat.length > 0) {
    await db.delete(tourRequests).where(inArray(tourRequests.id, turDibuat));
  }
  if (tiketDibuat.length > 0) {
    await db.delete(ticketRequests).where(inArray(ticketRequests.id, tiketDibuat));
  }
  if (pelangganDibuat.size > 0) {
    await db.delete(customers).where(inArray(customers.id, [...pelangganDibuat]));
  }
});
