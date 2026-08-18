export function formatRupiah(value: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;
}

/**
 * Sama seperti formatRupiah, tetapi tanda minus ditulis di depan simbol.
 *
 * "Rp -300.000" menyelipkan tandanya di tengah, tempat mata melompatinya saat
 * membaca cepat — dan margin yang minus adalah justru angka yang paling tidak
 * boleh terlewat.
 */
export function formatRupiahBertanda(value: number): string {
  return value < 0 ? `-${formatRupiah(-value)}` : formatRupiah(value);
}
