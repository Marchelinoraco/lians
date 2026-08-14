import { describe, it, expect } from 'vitest';
import { uraikanBlok } from '@/lib/blok-artikel';

describe('uraikanBlok', () => {
  it('memperlakukan baris biasa sebagai paragraf', () => {
    expect(uraikanBlok(['Halo', 'Dunia'])).toEqual([
      { jenis: 'paragraf', teks: 'Halo' },
      { jenis: 'paragraf', teks: 'Dunia' },
    ]);
  });

  it('mengenali subjudul', () => {
    expect(uraikanBlok(['## Bagian Satu'])).toEqual([{ jenis: 'judul', teks: 'Bagian Satu' }]);
  });

  it('menggabungkan butir daftar yang berurutan', () => {
    expect(uraikanBlok(['- satu', '- dua', 'penutup'])).toEqual([
      { jenis: 'daftar', butir: ['satu', 'dua'] },
      { jenis: 'paragraf', teks: 'penutup' },
    ]);
  });

  it('memisahkan dua daftar yang diselingi paragraf', () => {
    expect(uraikanBlok(['- a', 'jeda', '- b'])).toEqual([
      { jenis: 'daftar', butir: ['a'] },
      { jenis: 'paragraf', teks: 'jeda' },
      { jenis: 'daftar', butir: ['b'] },
    ]);
  });

  it('membuang baris kosong', () => {
    expect(uraikanBlok(['', '   ', 'isi'])).toEqual([{ jenis: 'paragraf', teks: 'isi' }]);
  });

  // Tanda yang tidak dikenali dibiarkan apa adanya. Isi artikel tidak boleh
  // diam-diam berubah bentuk hanya karena staf mengetik karakter tertentu.
  it('tidak menafsirkan tanda lain', () => {
    expect(uraikanBlok(['**tebal**', '<b>tag</b>', '# satu pagar'])).toEqual([
      { jenis: 'paragraf', teks: '**tebal**' },
      { jenis: 'paragraf', teks: '<b>tag</b>' },
      { jenis: 'paragraf', teks: '# satu pagar' },
    ]);
  });

  it('mengembalikan larik kosong untuk isi yang kosong', () => {
    expect(uraikanBlok([])).toEqual([]);
  });
});
