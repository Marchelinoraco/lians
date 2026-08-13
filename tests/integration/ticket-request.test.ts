import { describe, it, expect, afterAll, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';

// IP diacak per proses agar pembatas laju tidak menolak tes saat dijalankan berulang.
const IP_UJI = `198.51.99.${Math.floor(Math.random() * 250) + 1}`;

vi.mock('next/headers', () => ({
  headers: async () => new Map([['x-forwarded-for', IP_UJI]]) as unknown as Headers,
}));

const { db } = await import('@/db');
const { ticketRequests, customers, rateLimits } = await import('@/db/schema');
const { createTicketRequest } = await import('@/actions/ticket-request');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const dibuat: string[] = [];
const pelangganDibuat = new Set<string>();

const nomorUji = () => `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`;

const dasar = () => ({
  origin: 'Manado',
  destination: 'Jakarta',
  airline: 'garuda',
  departureDate: '2099-11-01',
  pax: 2,
  customerName: 'Uji Tiket',
  phone: nomorUji(),
});

async function catat(kode: string) {
  const [row] = await db.select().from(ticketRequests).where(eq(ticketRequests.requestCode, kode));
  if (!row) return null;
  dibuat.push(row.id);
  if (row.customerId) pelangganDibuat.add(row.customerId);
  return row;
}

jalankan('permintaan tiket', () => {
  // Berkas ini mengirim lebih dari lima permintaan, sementara pembatas laju
  // memang hanya mengizinkan lima per jam per IP. Hitungannya direset tiap tes
  // supaya yang diuji di sini logika permintaan tiket; pembatas lajunya sendiri
  // sudah punya tes tersendiri.
  beforeEach(async () => {
    await db.delete(rateLimits).where(eq(rateLimits.key, `tiket:${IP_UJI}`));
  });

  it('menyimpan permintaan dan mengembalikan tautan WhatsApp', async () => {
    const hasil = await createTicketRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const row = await catat(hasil.data.requestCode);
    expect(row?.origin).toBe('Manado');
    expect(row?.destination).toBe('Jakarta');
    expect(row?.airline).toBe('garuda');
    expect(row?.pax).toBe(2);
    expect(row?.status).toBe('pending');
    expect(hasil.data.whatsappUrl).toContain('wa.me');
  });

  it('menerima maskapai kosong sebagai "belum menentukan"', async () => {
    const hasil = await createTicketRequest({ ...dasar(), airline: '' });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const row = await catat(hasil.data.requestCode);
    expect(row?.airline).toBeNull();

    // Staf harus tahu bahwa pelanggan ini justru perlu dibantu memilih.
    const pesan = decodeURIComponent(hasil.data.whatsappUrl);
    expect(pesan).toMatch(/Belum menentukan/i);
  });

  it('menolak kode maskapai yang tidak ada di daftar', async () => {
    const hasil = await createTicketRequest({ ...dasar(), airline: 'maskapai-karangan' });
    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.airline?.[0]).toMatch(/tidak dikenal/i);
  });

  it('menolak jumlah penumpang nol dan negatif', async () => {
    expect(await createTicketRequest({ ...dasar(), pax: 0 })).toMatchObject({ ok: false });
    expect(await createTicketRequest({ ...dasar(), pax: -2 })).toMatchObject({ ok: false });
  });

  it('menolak tanggal kembali sebelum keberangkatan', async () => {
    const hasil = await createTicketRequest({
      ...dasar(),
      departureDate: '2099-11-10',
      returnDate: '2099-11-03',
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.returnDate?.[0]).toMatch(/sebelum tanggal keberangkatan/i);
  });

  it('menolak kota tujuan yang sama dengan kota asal', async () => {
    const hasil = await createTicketRequest({
      ...dasar(),
      origin: 'Manado',
      destination: 'manado',
    });

    expect(hasil.ok).toBe(false);
    if (hasil.ok) return;
    expect(hasil.fieldErrors?.destination?.[0]).toMatch(/sama dengan kota asal/i);
  });

  it('membuat catatan pelanggan dari permintaan tiket', async () => {
    const hasil = await createTicketRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;

    const row = await catat(hasil.data.requestCode);
    expect(row?.customerId).toBeTruthy();
  });

  it('tidak menyebut harga apa pun di pesan WhatsApp', async () => {
    const hasil = await createTicketRequest(dasar());
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    await catat(hasil.data.requestCode);

    const pesan = decodeURIComponent(hasil.data.whatsappUrl);
    expect(pesan).not.toMatch(/Rp\s?[0-9]/);
    expect(pesan).toMatch(/Mohon dicek harga dan ketersediaan/);
  });
});

afterAll(async () => {
  for (const id of dibuat) await db.delete(ticketRequests).where(eq(ticketRequests.id, id));
  for (const id of pelangganDibuat) await db.delete(customers).where(eq(customers.id, id));
  await db.delete(rateLimits).where(eq(rateLimits.key, `tiket:${IP_UJI}`));
});
