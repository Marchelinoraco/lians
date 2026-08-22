import { describe, it, expect } from 'vitest';
import {
  LABEL_LAYANAN,
  LAYANAN_PESANAN_BARU,
  JENIS_LAYANAN,
} from '@/lib/label-layanan';

describe('label jenis layanan di admin', () => {
  it('memakai tiga nama yang dipakai LIANS sehari-hari', () => {
    expect(LABEL_LAYANAN['self-drive']).toBe('Lepas Kunci');
    expect(LABEL_LAYANAN['with-driver']).toBe('Pelayanan (BBM + sopir)');
    expect(LABEL_LAYANAN.travel).toBe('Drop Off');
  });

  // Pariwisata tidak lagi ditawarkan saat mencatat pesanan baru, tetapi satu
  // pesanan lama sudah memakainya dan tiga kendaraan masih menawarkannya di
  // katalog. Tanpa label, keduanya akan tampil sebagai kode mentah.
  it('tetap menyediakan label untuk pariwisata yang tidak lagi ditawarkan', () => {
    expect(LABEL_LAYANAN.tourism).toBeTruthy();
  });

  it('memberi label pada setiap jenis yang dikenal database', () => {
    for (const jenis of JENIS_LAYANAN) {
      expect(LABEL_LAYANAN[jenis]).toBeTruthy();
    }
  });
});

describe('pilihan saat mencatat pesanan baru', () => {
  it('menawarkan tepat tiga jenis', () => {
    expect(LAYANAN_PESANAN_BARU).toHaveLength(3);
  });

  it('tidak lagi menawarkan pariwisata', () => {
    expect(LAYANAN_PESANAN_BARU).not.toContain('tourism');
  });

  it('hanya berisi jenis yang dikenal database', () => {
    for (const jenis of LAYANAN_PESANAN_BARU) {
      expect(JENIS_LAYANAN).toContain(jenis);
    }
  });
});
