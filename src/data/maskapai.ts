export type Maskapai = { kode: string; nama: string };

/**
 * Maskapai yang tiketnya dapat dipesankan LIANS.
 *
 * Sengaja TIDAK disebut "mitra" atau "partner": menyebut kemitraan yang belum
 * tentu ada adalah klaim yang bisa dipersoalkan. Menyebutkan maskapai yang
 * tiketnya bisa dipesankan adalah pernyataan faktual yang wajar bagi agen.
 *
 * Tanpa logo — logo adalah merek dagang pihak lain.
 *
 * Statis di repo karena jarang berubah dan tidak perlu CRUD: menyunting daftar
 * ini lalu menerbitkan ulang sudah cukup.
 */
export const MASKAPAI: readonly Maskapai[] = [
  { kode: 'garuda', nama: 'Garuda Indonesia' },
  { kode: 'citilink', nama: 'Citilink' },
  { kode: 'lion', nama: 'Lion Air' },
  { kode: 'batik', nama: 'Batik Air' },
  { kode: 'wings', nama: 'Wings Air' },
  { kode: 'super-air-jet', nama: 'Super Air Jet' },
];

export const MASKAPAI_KODE: string[] = MASKAPAI.map((m) => m.kode);

export function namaMaskapai(kode: string | null | undefined): string | null {
  if (!kode) return null;
  return MASKAPAI.find((m) => m.kode === kode)?.nama ?? null;
}
