import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';

// IP diacak per proses agar pembatas laju tidak menolak tes saat dijalankan berulang.
const IP_UJI = `192.0.2.${Math.floor(Math.random() * 250) + 1}`;

vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-forwarded-for', IP_UJI]]) as unknown as Headers,
}));

const { db } = await import('@/db');
const { tourRequests, customers, rateLimits } = await import('@/db/schema');
const { createTourRequest } = await import('@/actions/tour-request');
const { TOUR_SLUGS, getTourBySlug } = await import('@/data/tours');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];
const pelangganDibuat = new Set<string>();

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

const dasar = () => ({
  tourSlug: TOUR_SLUGS[0],
  customerName: 'Uji Tur',
  phone: nomorUji(),
  pax: 4,
  startDate: '2099-10-01',
});

/** Mencatat permintaan dan pelanggan yang lahir darinya agar ikut dibersihkan. */
async function catat(kode: string) {
  const [row] = await db.select().from(tourRequests).where(eq(tourRequests.requestCode, kode));
  if (!row) return null;
  dibuat.push(row.id);
  if (row.customerId) pelangganDibuat.add(row.customerId);
  return row;
}

jalankan('permintaan tur', () => {
  // Berkas ini mengirim lebih dari lima permintaan, sementara pembatas laju
  // memang hanya mengizinkan lima per jam per IP. Hitungannya direset tiap tes
  // supaya yang diuji di sini logika permintaan tur — pembatas lajunya sendiri
  // sudah punya tes tersendiri di tests/integration/rate-limit.test.ts.
  beforeEach(async () => {
    await db.delete(rateLimits).where(eq(rateLimits.key, `tur:${IP_UJI}`));
  });

  it('menyimpan permintaan dan mengembalikan tautan WhatsApp', async () => {
    const hasil = await createTourRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const row = await catat(hasil.data.requestCode);
    expect(row).toBeTruthy();
    expect(row?.pax).toBe(4);
    expect(row?.status).toBe('pending');
    expect(hasil.data.whatsappUrl).toContain('wa.me');
  });

  it('menyalin nama paket, bukan hanya slug-nya', async () => {
    const hasil = await createTourRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const row = await catat(hasil.data.requestCode);
    // Mengganti judul paket kelak tidak boleh mengubah isi permintaan lama.
    expect(row?.tourNameSnapshot).toBe(getTourBySlug(TOUR_SLUGS[0])?.name.id);
  });

  it('menolak slug paket yang tidak ada', async () => {
    const hasil = await createTourRequest({ ...dasar(), tourSlug: 'paket-karangan' });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.tourSlug?.[0]).toMatch(/tidak ditemukan/i);
  });

  it('menolak jumlah peserta nol dan negatif', async () => {
    expect(await createTourRequest({ ...dasar(), pax: 0 })).toMatchObject({ ok: false });
    expect(await createTourRequest({ ...dasar(), pax: -3 })).toMatchObject({ ok: false });
  });

  it('menolak tanggal selesai sebelum tanggal mulai', async () => {
    const hasil = await createTourRequest({
      ...dasar(),
      startDate: '2099-10-10',
      endDate: '2099-10-03',
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.endDate?.[0]).toMatch(/sebelum tanggal mulai/i);
  });

  it('menerima tanggal selesai yang sama dengan tanggal mulai', async () => {
    const hasil = await createTourRequest({
      ...dasar(),
      startDate: '2099-10-10',
      endDate: '2099-10-10',
    });

    expect(hasil.ok).toBe(true);
    if (hasil.ok) await catat(hasil.data.requestCode);
  });

  it('menolak nomor WhatsApp yang bukan format Indonesia', async () => {
    expect(await createTourRequest({ ...dasar(), phone: '12345' })).toMatchObject({ ok: false });
  });

  it('membuat catatan pelanggan dari permintaan tur', async () => {
    const hasil = await createTourRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const row = await catat(hasil.data.requestCode);
    expect(row?.customerId).toBeTruthy();
  });

  it('tidak menyebut harga apa pun di pesan WhatsApp', async () => {
    const hasil = await createTourRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.requestCode);

    const pesan = decodeURIComponent(hasil.data.whatsappUrl);
    expect(pesan).not.toMatch(/Rp\s?[0-9]/);
    expect(pesan).toMatch(/Mohon informasi harga/);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(tourRequests).where(eq(tourRequests.id, id));
  for (const id of pelangganDibuat) await db.delete(customers).where(eq(customers.id, id));
  await db.delete(rateLimits).where(eq(rateLimits.key, `tur:${IP_UJI}`));
});
