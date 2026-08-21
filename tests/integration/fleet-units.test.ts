import { describe, it, expect, afterAll, vi } from 'vitest';
import { eq } from 'drizzle-orm';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

const { db } = await import('@/db');
const { fleetUnits, bookings, vehicles } = await import('@/db/schema');
const { createFleetUnit, updateFleetUnit, deleteFleetUnit } = await import(
  '@/actions/admin-fleet-units'
);
const { cariBentrokUnit } = await import('@/queries/fleet-units');
const { cekBentrokUnit } = await import('@/actions/admin-fleet-units');
const { createManualBooking } = await import('@/actions/admin-manual-booking');

const jalankan = process.env.DATABASE_URL ? describe : describe.skip;
const unitDibuat: string[] = [];
const pesananDibuat: string[] = [];
const bersesi = () => authMock.mockResolvedValue({ user: { id: 'uji', email: 'uji@lians.id' } });

const nopolUji = () => `B ${Math.floor(1000 + Math.random() * 8999)} UJI`;

async function duaModel() {
  const v = await db.select({ id: vehicles.id }).from(vehicles).limit(2);
  if (v.length < 2) throw new Error('butuh minimal dua model kendaraan');
  return [v[0].id, v[1].id] as const;
}

async function buatUnit(over: Record<string, unknown> = {}) {
  bersesi();
  const [modelA] = await duaModel();
  const hasil = await createFleetUnit({ plate: nopolUji(), vehicleId: modelA, ...over });
  if (!hasil.ok) throw new Error(`gagal membuat unit uji: ${hasil.message}`);
  unitDibuat.push(hasil.data.id);
  return hasil.data.id;
}

async function buatPesanan(fleetUnitId: string | null, startDate: string, endDate: string | null, status = 'confirmed') {
  const [row] = await db
    .insert(bookings)
    .values({
      bookingCode: `LNS-UNIT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
      customerName: 'Uji Unit',
      phone: '081234567890',
      serviceType: 'with-driver',
      startDate,
      endDate,
      fleetUnitId,
      status: status as 'confirmed',
    })
    .returning({ id: bookings.id });
  pesananDibuat.push(row.id);
  return row.id;
}

jalankan('unit armada LIANS', () => {
  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    const [modelA] = await duaModel();
    expect((await createFleetUnit({ plate: nopolUji(), vehicleId: modelA })).ok).toBe(false);
  });

  it('menyeragamkan penulisan nomor polisi saat disimpan', async () => {
    bersesi();
    const [modelA] = await duaModel();
    const hasil = await createFleetUnit({ plate: '  db 1012   ri ', vehicleId: modelA });
    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    unitDibuat.push(hasil.data.id);

    const [row] = await db.select().from(fleetUnits).where(eq(fleetUnits.id, hasil.data.id));
    expect(row.plate).toBe('DB 1012 RI');
    // Nama model disalin supaya unit tetap terbaca bila modelnya dihapus.
    expect(row.vehicleNameSnapshot).toBeTruthy();
  });

  it('menolak nomor polisi yang sama pada model yang sama', async () => {
    bersesi();
    const [modelA] = await duaModel();
    const nopol = nopolUji();

    const satu = await createFleetUnit({ plate: nopol, vehicleId: modelA });
    expect(satu.ok).toBe(true);
    if (satu.ok) unitDibuat.push(satu.data.id);

    const dua = await createFleetUnit({ plate: nopol, vehicleId: modelA });
    expect(dua.ok).toBe(false);
  });

  // Pemilik menegaskan B 7681 BDB tercatat pada bus sekaligus Hiace Premio.
  it('mengizinkan nomor polisi sama pada model yang berbeda', async () => {
    bersesi();
    const [modelA, modelB] = await duaModel();
    const nopol = nopolUji();

    const satu = await createFleetUnit({ plate: nopol, vehicleId: modelA });
    const dua = await createFleetUnit({ plate: nopol, vehicleId: modelB });

    expect(satu.ok).toBe(true);
    expect(dua.ok).toBe(true);
    if (satu.ok) unitDibuat.push(satu.data.id);
    if (dua.ok) unitDibuat.push(dua.data.id);
  });
});

jalankan('menyunting dan menghapus unit', () => {
  it('menyeragamkan nomor polisi yang disunting, sama seperti saat dibuat', async () => {
    const id = await buatUnit();
    const [modelA] = await duaModel();
    bersesi();

    const hasil = await updateFleetUnit(id, { plate: ' b 9999   zz ', vehicleId: modelA });

    expect(hasil.ok).toBe(true);
    const [row] = await db.select().from(fleetUnits).where(eq(fleetUnits.id, id));
    expect(row.plate).toBe('B 9999 ZZ');
  });

  // Unit yang dijual dinonaktifkan, bukan dihapus: pesanan lama yang memakainya
  // harus tetap terbaca. Penandanya karena itu wajib benar-benar tersimpan.
  it('menyimpan penanda tidak dioperasikan', async () => {
    const id = await buatUnit();
    const [modelA] = await duaModel();
    bersesi();

    await updateFleetUnit(id, { plate: 'B 1111 AA', vehicleId: modelA, isActive: false });

    const [row] = await db.select().from(fleetUnits).where(eq(fleetUnits.id, id));
    expect(row.isActive).toBe(false);
  });

  it('menghapus unit', async () => {
    const id = await buatUnit();
    bersesi();

    expect((await deleteFleetUnit(id)).ok).toBe(true);
    expect(await db.select().from(fleetUnits).where(eq(fleetUnits.id, id))).toHaveLength(0);
  });

  it('menolak menghapus tanpa sesi', async () => {
    const id = await buatUnit();
    authMock.mockResolvedValue(null);

    expect((await deleteFleetUnit(id)).ok).toBe(false);
    expect(await db.select().from(fleetUnits).where(eq(fleetUnits.id, id))).toHaveLength(1);
  });
});

jalankan('cariBentrokUnit', () => {
  it('menemukan pesanan lain yang tanggalnya bertumpuk pada unit itu', async () => {
    const unit = await buatUnit();
    await buatPesanan(unit, '2099-09-12', '2099-09-14');

    const bentrok = await cariBentrokUnit(unit, { startDate: '2099-09-13', endDate: '2099-09-15' });

    expect(bentrok).toHaveLength(1);
    expect(bentrok[0].customerName).toBe('Uji Unit');
  });

  it('diam bila tanggalnya tidak bersinggungan', async () => {
    const unit = await buatUnit();
    await buatPesanan(unit, '2099-09-12', '2099-09-14');

    expect(await cariBentrokUnit(unit, { startDate: '2099-09-15', endDate: '2099-09-17' })).toHaveLength(0);
  });

  // Pesanan yang batal tidak menahan kendaraan apa pun.
  it('mengabaikan pesanan yang dibatalkan', async () => {
    const unit = await buatUnit();
    await buatPesanan(unit, '2099-10-01', '2099-10-03', 'cancelled');

    expect(await cariBentrokUnit(unit, { startDate: '2099-10-01', endDate: '2099-10-03' })).toHaveLength(0);
  });

  // Tanpa ini, menyunting pesanan tanpa mengubah tanggalnya akan memperingatkan
  // bahwa unit itu bentrok dengan dirinya sendiri.
  it('tidak menghitung pesanan yang sedang disunting sebagai bentrok', async () => {
    const unit = await buatUnit();
    const id = await buatPesanan(unit, '2099-11-01', '2099-11-03');

    const bentrok = await cariBentrokUnit(unit, { startDate: '2099-11-01', endDate: '2099-11-03' }, id);
    expect(bentrok).toHaveLength(0);
  });

  it('tidak mencampurkan pesanan dari unit lain', async () => {
    const unitA = await buatUnit();
    const unitB = await buatUnit();
    await buatPesanan(unitA, '2099-12-01', '2099-12-03');

    expect(await cariBentrokUnit(unitB, { startDate: '2099-12-01', endDate: '2099-12-03' })).toHaveLength(0);
  });
});

jalankan('pesanan menunjuk unit fisik', () => {
  it('menyimpan unit yang dipilih pada pesanan manual', async () => {
    const unit = await buatUnit();
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Unit Pesanan',
      phone: `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`,
      serviceType: 'with-driver',
      itemName: 'Zenix G + sopir',
      startDate: '2099-08-01',
      endDate: '2099-08-03',
      totalPrice: 3600000,
      asalKendaraan: 'sendiri',
      fleetUnitId: unit,
    });

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    pesananDibuat.push(hasil.data.id);

    const [row] = await db.select().from(bookings).where(eq(bookings.id, hasil.data.id));
    expect(row.fleetUnitId).toBe(unit);
  });

  // Peringatan, bukan penghalang: pesanan yang bentrok tetap tersimpan, sebab
  // kekurangan unit diselesaikan dengan menyewa dari pemasok.
  it('tetap menyimpan pesanan yang unitnya bentrok', async () => {
    const unit = await buatUnit();
    await buatPesanan(unit, '2099-08-10', '2099-08-12');
    bersesi();

    const hasil = await createManualBooking({
      customerName: 'Uji Bentrok',
      phone: `08${Math.floor(1_000_000_000 + Math.random() * 8_999_999_999)}`,
      serviceType: 'with-driver',
      itemName: 'Zenix G + sopir',
      startDate: '2099-08-11',
      endDate: '2099-08-13',
      totalPrice: 3600000,
      asalKendaraan: 'sendiri',
      fleetUnitId: unit,
    });

    expect(hasil.ok).toBe(true);
    if (hasil.ok) pesananDibuat.push(hasil.data.id);
  });

  it('melaporkan bentrok lewat aksi yang dipanggil form', async () => {
    const unit = await buatUnit();
    await buatPesanan(unit, '2099-08-20', '2099-08-22');
    bersesi();

    const hasil = await cekBentrokUnit(unit, '2099-08-21', '2099-08-23');

    expect(hasil.ok).toBe(true);
    if (!hasil.ok) return;
    expect(hasil.data.bentrok).toHaveLength(1);
    expect(hasil.data.bentrok[0].customerName).toBe('Uji Unit');
  });

  it('tidak melaporkan apa pun bila unitnya belum dipilih', async () => {
    bersesi();
    const hasil = await cekBentrokUnit('', '2099-08-21', '2099-08-23');
    expect(hasil.ok).toBe(true);
    if (hasil.ok) expect(hasil.data.bentrok).toHaveLength(0);
  });
});

afterAll(async () => {
  for (const id of pesananDibuat) await db.delete(bookings).where(eq(bookings.id, id));
  for (const id of unitDibuat) await db.delete(fleetUnits).where(eq(fleetUnits.id, id));
});
