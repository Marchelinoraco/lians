import { describe, it, expect } from 'vitest';
import type { Booking } from '@/db/schema';
import {
  saringPesanan,
  susunBaris,
  kolomEkspor,
  namaBerkas,
} from '@/lib/ekspor-pesanan';

function pesanan(over: Partial<Booking> = {}): Booking {
  return {
    id: 'x',
    bookingCode: 'LNS-1',
    customerName: 'Budi',
    phone: '6281234567890',
    email: null,
    customerId: null,
    serviceType: 'self-drive',
    vehicleId: null,
    routeId: null,
    supplierVehicleId: null,
    supplierNameSnapshot: null,
    supplierCost: null,
    supplierPaid: false,
    costFuel: null,
    costDriver: null,
    costTollParking: null,
    costOther: null,
    costOtherNote: null,
    vehicleNameSnapshot: 'Avanza',
    routeNameSnapshot: null,
    startDate: '2026-08-10',
    endDate: '2026-08-12',
    rateType: null,
    rateCategory: 'lepas-kunci',
    driverDays: 0,
    totalPrice: 500000,
    priceBreakdown: null,
    priceEditedAt: null,
    notes: null,
    status: 'confirmed',
    source: 'website',
    adminNotes: null,
    createdAt: new Date('2026-08-05T03:00:00Z'),
    updatedAt: new Date('2026-08-05T03:00:00Z'),
    ...over,
  } as Booking;
}

describe('saringPesanan', () => {
  it('menyaring menurut status', () => {
    const semua = [pesanan({ status: 'confirmed' }), pesanan({ status: 'cancelled' })];
    expect(saringPesanan(semua, { status: 'confirmed' })).toHaveLength(1);
  });

  it('menyaring menurut rentang tanggal masuk', () => {
    const semua = [
      pesanan({ createdAt: new Date('2026-07-01T00:00:00Z') }),
      pesanan({ createdAt: new Date('2026-08-15T00:00:00Z') }),
    ];
    expect(saringPesanan(semua, { dari: '2026-08-01' })).toHaveLength(1);
    expect(saringPesanan(semua, { sampai: '2026-07-31' })).toHaveLength(1);
    expect(saringPesanan(semua, { dari: '2026-01-01', sampai: '2026-12-31' })).toHaveLength(2);
  });

  it('memasukkan pesanan yang jatuh tepat di batas', () => {
    const semua = [pesanan({ createdAt: new Date('2026-08-05T23:59:00Z') })];
    expect(saringPesanan(semua, { dari: '2026-08-05', sampai: '2026-08-05' })).toHaveLength(1);
  });

  it('tanpa filter mengembalikan semuanya', () => {
    const semua = [pesanan(), pesanan()];
    expect(saringPesanan(semua, {})).toHaveLength(2);
  });
});

describe('susunBaris', () => {
  it('menyembunyikan seluruh kolom uang bila bukan super admin', () => {
    const [baris] = susunBaris([pesanan({ totalPrice: 500000, supplierCost: 300000 })], false);

    expect(baris.total).toBeUndefined();
    expect(baris.biayaPemasok).toBeUndefined();
    expect(baris.biayaOperasional).toBeUndefined();
    expect(baris.margin).toBeUndefined();
    // Kolom operasional tetap ada — staf memang perlu daftar ini.
    expect(baris.pelanggan).toBe('Budi');
    expect(baris.kode).toBe('LNS-1');
  });

  it('menyertakan uang dan menghitung margin untuk super admin', () => {
    const [baris] = susunBaris([pesanan({ totalPrice: 700000, supplierCost: 450000 })], true);

    expect(baris.total).toBe(700000);
    expect(baris.biayaPemasok).toBe(450000);
    expect(baris.margin).toBe(250000);
  });

  it('mengurangi biaya operasional dari margin, juga pada kendaraan sendiri', () => {
    const [baris] = susunBaris(
      [
        pesanan({
          totalPrice: 2000000,
          supplierCost: null,
          costFuel: 400000,
          costDriver: 250000,
        }),
      ],
      true,
    );

    expect(baris.biayaOperasional).toBe(650000);
    expect(baris.margin).toBe(1350000);
  });

  it('mengurangi biaya operasional di atas biaya pemasok pada mobil pinjaman', () => {
    const [baris] = susunBaris(
      [pesanan({ totalPrice: 3600000, supplierCost: 2000000, costFuel: 650000 })],
      true,
    );

    expect(baris.margin).toBe(950000);
  });

  // Rute travel tanpa tarif tetap: angkanya memang belum ada, dan "Rp 0" akan
  // terbaca sebagai pesanan yang tidak menghasilkan apa-apa.
  it('mengosongkan margin bila harga ke pelanggan belum ditentukan', () => {
    const [baris] = susunBaris([pesanan({ totalPrice: null, supplierCost: 100000 })], true);
    expect(baris.margin).toBeNull();
  });

  it('menandai asal pesanan', () => {
    const [web] = susunBaris([pesanan({ source: 'website' })], false);
    const [manual] = susunBaris([pesanan({ source: 'manual' })], false);
    expect(web.asal).toBe('Website');
    expect(manual.asal).toBe('Manual');
  });

  it('memakai nama rute bila pesanan bukan kendaraan', () => {
    const [baris] = susunBaris(
      [pesanan({ vehicleNameSnapshot: null, routeNameSnapshot: 'Manado → Gorontalo' })],
      false,
    );
    expect(baris.pesanan).toBe('Manado → Gorontalo');
  });
});

describe('kolomEkspor', () => {
  it('tidak memuat kolom uang untuk admin biasa', () => {
    const judul = kolomEkspor(false).map((k) => k.judul);
    expect(judul).not.toContain('Total');
    expect(judul).not.toContain('Margin');
    expect(judul).not.toContain('Biaya pemasok');
  });

  it('memuat kolom uang untuk super admin', () => {
    const judul = kolomEkspor(true).map((k) => k.judul);
    expect(judul).toContain('Total');
    expect(judul).toContain('Margin');
  });
});

describe('namaBerkas', () => {
  it('menyertakan rentang tanggal agar unduhan lama tidak tertukar', () => {
    expect(namaBerkas({ dari: '2026-08-01', sampai: '2026-08-31' }, 'xlsx')).toBe(
      'pesanan-lians-2026-08-01-2026-08-31.xlsx',
    );
  });

  it('memakai tanggal hari ini bila tanpa rentang', () => {
    const hariIni = new Date().toISOString().slice(0, 10);
    expect(namaBerkas({}, 'pdf')).toBe(`pesanan-lians-${hariIni}.pdf`);
  });
});
