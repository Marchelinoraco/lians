import { describe, expect, it } from 'vitest';
import type { TicketRequest, TourRequest } from '@/db/schema';
import {
  susunBarisTur,
  susunBarisTiket,
  KOLOM_TUR,
  KOLOM_TIKET,
} from '@/lib/ekspor-permintaan';
import { saringPermintaan } from '@/lib/saring-permintaan';

function permintaanTur(ubah: Partial<TourRequest> = {}): TourRequest {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    requestCode: 'LNS-2608-0001',
    tourSlug: 'bunaken-snorkeling',
    tourNameSnapshot: 'Bunaken Snorkeling Sehari',
    customerName: 'Grace Tumbelaka',
    phone: '6281234567890',
    email: null,
    customerId: null,
    pax: 4,
    startDate: '2026-09-01',
    endDate: null,
    notes: null,
    status: 'pending',
    source: 'website',
    adminNotes: null,
    createdAt: new Date('2026-08-16T03:00:00Z'),
    updatedAt: new Date('2026-08-16T03:00:00Z'),
    ...ubah,
  } as TourRequest;
}

function permintaanTiket(ubah: Partial<TicketRequest> = {}): TicketRequest {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    requestCode: 'LNS-2608-0002',
    origin: 'Manado',
    destination: 'Jakarta',
    airline: 'garuda',
    departureDate: '2026-09-10',
    returnDate: null,
    pax: 2,
    customerName: 'Denny Wowor',
    phone: '6281299887766',
    email: null,
    customerId: null,
    notes: null,
    status: 'confirmed',
    source: 'manual',
    adminNotes: null,
    createdAt: new Date('2026-08-10T03:00:00Z'),
    updatedAt: new Date('2026-08-10T03:00:00Z'),
    ...ubah,
  } as TicketRequest;
}

describe('ekspor permintaan', () => {
  it('tidak pernah memuat kolom rupiah — harga permintaan memang tidak tersimpan', () => {
    for (const kolom of [KOLOM_TUR, KOLOM_TIKET]) {
      expect(kolom.some((k) => k.uang)).toBe(false);
    }
  });

  it('menyusun setiap kolom yang dideklarasikan, tanpa sel yang hilang', () => {
    const [barisTur] = susunBarisTur([permintaanTur()]);
    for (const k of KOLOM_TUR) expect(barisTur[k.kunci]).toBeDefined();

    const [barisTiket] = susunBarisTiket([permintaanTiket()]);
    for (const k of KOLOM_TIKET) expect(barisTiket[k.kunci]).toBeDefined();
  });

  it('menandai asal permintaan, supaya yang dicatat staf dapat dibedakan', () => {
    expect(susunBarisTur([permintaanTur({ source: 'manual' })])[0].asal).toBe('Manual');
    expect(susunBarisTur([permintaanTur({ source: 'website' })])[0].asal).toBe('Website');
    expect(susunBarisTiket([permintaanTiket({ source: 'manual' })])[0].asal).toBe('Manual');
  });

  it('menulis nomor telepon utuh — berkas ini dipakai untuk menelepon', () => {
    const [baris] = susunBarisTur([permintaanTur({ phone: '6281234567890' })]);
    expect(baris.telepon).toBe('6281234567890');

    const kolomTelepon = KOLOM_TUR.find((k) => k.kunci === 'telepon');
    expect(kolomTelepon?.lebar).toBeGreaterThanOrEqual(String('6281234567890').length);
  });

  it('menerjemahkan kode maskapai jadi namanya, bukan menulis kodenya', () => {
    expect(susunBarisTiket([permintaanTiket({ airline: 'garuda' })])[0].maskapai).toBe(
      'Garuda Indonesia',
    );
    expect(susunBarisTiket([permintaanTiket({ airline: null })])[0].maskapai).toBe(
      'Belum ditentukan',
    );
  });

  it('menulis tanggal dd/mm/yyyy, dan em dash bila memang kosong', () => {
    const [baris] = susunBarisTur([
      permintaanTur({ startDate: '2026-09-01', endDate: null }),
    ]);
    expect(baris.mulai).toBe('01/09/2026');
    expect(baris.selesai).toBe('—');
  });

  it('tanggal tidak bergeser sehari karena zona waktu', () => {
    // Tanggal disimpan sebagai '2026-01-01' tanpa jam. Diurai sebagai UTC lalu
    // ditampilkan di WITA, tanggalnya akan mundur ke 31/12 — kesalahan yang
    // hanya muncul di sebagian tanggal sehingga mudah lolos tanpa uji.
    const [baris] = susunBarisTur([permintaanTur({ startDate: '2026-01-01' })]);
    expect(baris.mulai).toBe('01/01/2026');
  });
});

describe('saringPermintaan', () => {
  const daftar = [
    permintaanTur({ requestCode: 'A', status: 'pending', createdAt: new Date('2026-06-15') }),
    permintaanTur({ requestCode: 'B', status: 'confirmed', createdAt: new Date('2026-07-20') }),
    permintaanTur({ requestCode: 'C', status: 'pending', createdAt: new Date('2026-08-05') }),
  ];

  it('mengembalikan semuanya bila tidak ada filter', () => {
    expect(saringPermintaan(daftar, {})).toHaveLength(3);
  });

  it('menyaring menurut status', () => {
    const hasil = saringPermintaan(daftar, { status: 'pending' });
    expect(hasil.map((r) => r.requestCode)).toEqual(['A', 'C']);
  });

  it('menyaring menurut rentang tanggal masuk, batasnya ikut terpakai', () => {
    const hasil = saringPermintaan(daftar, { dari: '2026-07-20', sampai: '2026-08-05' });
    expect(hasil.map((r) => r.requestCode)).toEqual(['B', 'C']);
  });

  it('menggabungkan status dan rentang tanggal', () => {
    const hasil = saringPermintaan(daftar, { status: 'pending', dari: '2026-07-01' });
    expect(hasil.map((r) => r.requestCode)).toEqual(['C']);
  });
});
