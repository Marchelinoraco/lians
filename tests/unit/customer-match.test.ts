import { describe, it, expect, vi, beforeEach } from 'vitest';

const selectMock = vi.fn();
const insertMock = vi.fn();
const updateMock = vi.fn();

vi.mock('@/db', () => ({
  db: {
    select: () => ({ from: () => ({ where: () => ({ limit: selectMock }) }) }),
    insert: () => ({ values: () => ({ returning: insertMock }) }),
    update: () => ({ set: () => ({ where: updateMock }) }),
  },
}));

const { cocokkanAtauBuatPelanggan } = await import('@/lib/customer-match');

describe('cocokkanAtauBuatPelanggan', () => {
  beforeEach(() => {
    selectMock.mockReset();
    insertMock.mockReset();
    updateMock.mockReset();
  });

  it('memakai catatan yang ada bila nomornya cocok setelah dinormalkan', async () => {
    selectMock.mockResolvedValueOnce([{ id: 'ada', name: 'Budi', phone: '6281234567890' }]);
    updateMock.mockResolvedValueOnce(undefined);

    const id = await cocokkanAtauBuatPelanggan({ name: 'Budi', phone: '081234567890' });
    expect(id).toBe('ada');
    expect(insertMock).not.toHaveBeenCalled();
  });

  it('membuat catatan baru bila nomornya belum terdaftar', async () => {
    selectMock.mockResolvedValueOnce([]);
    insertMock.mockResolvedValueOnce([{ id: 'baru' }]);

    const id = await cocokkanAtauBuatPelanggan({ name: 'Sari', phone: '+6281199887766' });
    expect(id).toBe('baru');
    expect(updateMock).not.toHaveBeenCalled();
  });

  it('memperbarui nama pada catatan pelanggan yang sudah ada', async () => {
    selectMock.mockResolvedValueOnce([{ id: 'ada', name: 'Budi', phone: '6281234567890', email: null }]);
    updateMock.mockResolvedValueOnce(undefined);

    await cocokkanAtauBuatPelanggan({ name: 'Budi Santoso', phone: '081234567890' });
    expect(updateMock).toHaveBeenCalledTimes(1);
  });
});
