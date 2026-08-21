import { describe, it, expect } from 'vitest';
import { rentangBertumpuk, normalisasiNopol } from '@/lib/ketersediaan-unit';

const r = (mulai: string, selesai: string | null) => ({ startDate: mulai, endDate: selesai });

describe('rentangBertumpuk', () => {
  it('mengenali dua sewa yang saling menimpa di tengah', () => {
    expect(rentangBertumpuk(r('2026-09-12', '2026-09-14'), r('2026-09-13', '2026-09-15'))).toBe(true);
  });

  it('mengenali sewa yang seluruhnya berada di dalam sewa lain', () => {
    expect(rentangBertumpuk(r('2026-09-10', '2026-09-20'), r('2026-09-12', '2026-09-14'))).toBe(true);
  });

  // Unit yang kembali tanggal 14 tidak bisa berangkat lagi tanggal 14 dengan
  // penyewa lain: hari itu masih terpakai sampai kendaraannya dikembalikan.
  it('menganggap hari yang sama sebagai bertumpuk, bukan bersambung', () => {
    expect(rentangBertumpuk(r('2026-09-12', '2026-09-14'), r('2026-09-14', '2026-09-16'))).toBe(true);
  });

  it('membiarkan sewa yang benar-benar terpisah', () => {
    expect(rentangBertumpuk(r('2026-09-12', '2026-09-14'), r('2026-09-15', '2026-09-17'))).toBe(false);
  });

  // Pesanan lama dicatat sebelum tanggal selesai diwajibkan. Menganggapnya
  // tak berujung akan memblokir unit itu selamanya.
  it('memperlakukan tanggal selesai kosong sebagai sewa sehari', () => {
    expect(rentangBertumpuk(r('2026-09-12', null), r('2026-09-12', '2026-09-14'))).toBe(true);
    expect(rentangBertumpuk(r('2026-09-12', null), r('2026-09-13', '2026-09-14'))).toBe(false);
  });
});

describe('normalisasiNopol', () => {
  it('menyeragamkan huruf besar dan spasi berlebih', () => {
    expect(normalisasiNopol('  b 7195   qf ')).toBe('B 7195 QF');
  });

  // "B7195QF" dan "B 7195 QF" adalah kendaraan yang sama. Tanpa disamakan,
  // keduanya akan tersimpan sebagai dua unit dan hitungannya jadi dobel.
  it('menyamakan penulisan tanpa spasi dengan yang berspasi', () => {
    expect(normalisasiNopol('B7195QF')).toBe(normalisasiNopol('B 7195 QF'));
  });
});
