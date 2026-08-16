import type { TourRequest, TicketRequest } from '@/db/schema';
import { namaMaskapai } from '@/data/maskapai';
import type { BarisEkspor, Kolom, KonteksEkspor, NilaiSel } from './ekspor-pesanan';

/**
 * Ekspor permintaan tur dan tiket.
 *
 * Tidak ada satu pun kolom rupiah di sini, dan itu disengaja: permintaan
 * adalah permintaan penawaran, harganya baru disepakati lewat WhatsApp dan
 * memang tidak pernah tersimpan. Karena itu berkasnya sama untuk semua peran —
 * tidak ada yang perlu disembunyikan dari staf.
 */

function tanggalRingkas(nilai: string | Date | null): string {
  if (!nilai) return '—';
  const d = typeof nilai === 'string' ? new Date(`${nilai}T00:00:00`) : nilai;
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

const LABEL_STATUS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export const KONTEKS_TUR: KonteksEkspor = {
  judul: 'Permintaan Tur LIANS',
  lembar: 'Permintaan Tur',
  satuan: 'permintaan',
};

export const KONTEKS_TIKET: KonteksEkspor = {
  judul: 'Permintaan Tiket LIANS',
  lembar: 'Permintaan Tiket',
  satuan: 'permintaan',
};

export function susunBarisTur(daftar: TourRequest[]): BarisEkspor[] {
  return daftar.map((r) => {
    const baris: Record<string, NilaiSel> = {
      kode: r.requestCode,
      masuk: tanggalRingkas(r.createdAt),
      asal: r.source === 'manual' ? 'Manual' : 'Website',
      pelanggan: r.customerName,
      telepon: r.phone,
      paket: r.tourNameSnapshot,
      peserta: r.pax,
      mulai: tanggalRingkas(r.startDate),
      selesai: tanggalRingkas(r.endDate),
      status: LABEL_STATUS[r.status] ?? r.status,
    };
    return baris;
  });
}

export function susunBarisTiket(daftar: TicketRequest[]): BarisEkspor[] {
  return daftar.map((r) => {
    const baris: Record<string, NilaiSel> = {
      kode: r.requestCode,
      masuk: tanggalRingkas(r.createdAt),
      asal: r.source === 'manual' ? 'Manual' : 'Website',
      pelanggan: r.customerName,
      telepon: r.phone,
      rute: `${r.origin} → ${r.destination}`,
      maskapai: namaMaskapai(r.airline) ?? 'Belum ditentukan',
      penumpang: r.pax,
      berangkat: tanggalRingkas(r.departureDate),
      kembali: tanggalRingkas(r.returnDate),
      status: LABEL_STATUS[r.status] ?? r.status,
    };
    return baris;
  });
}

export const KOLOM_TUR: Kolom[] = [
  { kunci: 'kode', judul: 'Kode', lebar: 19 },
  { kunci: 'masuk', judul: 'Masuk', lebar: 11 },
  { kunci: 'asal', judul: 'Asal', lebar: 9 },
  { kunci: 'pelanggan', judul: 'Pelanggan', lebar: 22 },
  // Nomor telepon TIDAK boleh terpotong — ekspor ini dipakai untuk menelepon.
  { kunci: 'telepon', judul: 'WhatsApp', lebar: 17 },
  { kunci: 'paket', judul: 'Paket', lebar: 30 },
  { kunci: 'peserta', judul: 'Peserta', lebar: 9 },
  { kunci: 'mulai', judul: 'Mulai', lebar: 11 },
  { kunci: 'selesai', judul: 'Selesai', lebar: 11 },
  { kunci: 'status', judul: 'Status', lebar: 13 },
];

export const KOLOM_TIKET: Kolom[] = [
  { kunci: 'kode', judul: 'Kode', lebar: 19 },
  { kunci: 'masuk', judul: 'Masuk', lebar: 11 },
  { kunci: 'asal', judul: 'Asal', lebar: 9 },
  { kunci: 'pelanggan', judul: 'Pelanggan', lebar: 22 },
  { kunci: 'telepon', judul: 'WhatsApp', lebar: 17 },
  { kunci: 'rute', judul: 'Rute', lebar: 26 },
  { kunci: 'maskapai', judul: 'Maskapai', lebar: 18 },
  { kunci: 'penumpang', judul: 'Penumpang', lebar: 11 },
  { kunci: 'berangkat', judul: 'Berangkat', lebar: 11 },
  { kunci: 'kembali', judul: 'Kembali', lebar: 11 },
  { kunci: 'status', judul: 'Status', lebar: 13 },
];
