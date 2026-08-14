/**
 * Kelas bersama untuk isian admin.
 *
 * Sebelumnya string yang sama persis disalin di sebelas berkas form. Bukan
 * hanya boros — setiap perbaikan kecil (misalnya menambahkan cincin fokus)
 * harus diketik ulang sebelas kali dan pasti ada yang terlewat, sehingga satu
 * dua form diam-diam terlihat berbeda dari yang lain.
 */

/**
 * Cincin fokus ditulis di sini, bukan diserahkan ke garis bawaan peramban:
 * garis bawaan hampir tak terlihat di atas tepi abu-abu, padahal form panjang
 * seperti data kendaraan sering diisi dengan Tab, bukan dengan tetikus.
 */
const RUPA_ISIAN =
  'rounded-lg border border-slate-300 py-2 text-sm transition-colors ' +
  'focus:border-lians-500 focus:outline-none focus:ring-2 focus:ring-lians-100 ' +
  'disabled:bg-slate-50 disabled:text-muted';

export const KELAS_ISIAN_DASAR = `px-3 ${RUPA_ISIAN}`;

/** Lebar penuh — bentuk yang dipakai hampir semua isian. */
export const KELAS_ISIAN = `w-full ${KELAS_ISIAN_DASAR}`;

/**
 * Ruang kiri untuk ikon di dalam kotak. Padding kiri ditulis di sini, bukan
 * ditumpuk sebagai kelas tambahan: `pl-9` dan `px-3` mengatur properti yang
 * sama, dan yang menang ditentukan urutan di berkas CSS — bukan urutan yang
 * kita tulis di atribut.
 */
export const KELAS_ISIAN_IKON = `pl-9 pr-3 ${RUPA_ISIAN}`;

export const KELAS_LABEL = 'mb-1 block text-sm font-semibold';

/** Keterangan di bawah isian — menjelaskan akibat, bukan mengulang labelnya. */
export const KELAS_BANTUAN = 'mt-1 block text-xs leading-relaxed text-muted';

/** Kotak centang memakai warna merek, bukan biru bawaan sistem. */
export const KELAS_CENTANG = 'h-4 w-4 shrink-0 accent-lians-500';

export const KELAS_TOMBOL_UTAMA =
  'rounded-lg bg-lians-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors ' +
  'hover:bg-lians-600 focus:outline-none focus:ring-2 focus:ring-lians-200 disabled:opacity-50';

export const KELAS_TOMBOL_KEDUA =
  'rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold transition-colors ' +
  'hover:border-lians-400 focus:outline-none focus:ring-2 focus:ring-lians-100';

/** Setinggi kotak isian, supaya tombol di samping kolom cari lurus dengannya. */
export const KELAS_TOMBOL_KEDUA_KECIL =
  'rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold transition-colors ' +
  'hover:border-lians-400 focus:outline-none focus:ring-2 focus:ring-lians-100';
