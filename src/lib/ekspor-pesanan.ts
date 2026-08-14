import type { Booking } from '@/db/schema';
/**
 * Tanggal ringkas dd/mm/yyyy, bukan "15 Agustus 2026".
 *
 * Bentuk panjang memakan tiga kali lebar kolom dan terpotong di PDF —
 * "15 Agustus…" tidak memberi tahu tahunnya. Bentuk angka lazim dipakai di
 * Indonesia dan muat di kolom sempit.
 */
function tanggalRingkas(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export type BarisEkspor = {
  kode: string;
  masuk: string;
  asal: string;
  pelanggan: string;
  telepon: string;
  pesanan: string;
  mulai: string;
  selesai: string;
  status: string;
  /** Hanya diisi untuk super admin; undefined berarti kolomnya tidak ditulis. */
  total?: number | null;
  biayaPemasok?: number | null;
  margin?: number | null;
};

const LABEL_STATUS: Record<string, string> = {
  pending: 'Menunggu',
  confirmed: 'Dikonfirmasi',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

export type FilterEkspor = {
  status?: string;
  /** Batas tanggal berdasarkan kapan pesanan masuk, format YYYY-MM-DD. */
  dari?: string;
  sampai?: string;
};

export function saringPesanan(semua: Booking[], filter: FilterEkspor): Booking[] {
  return semua.filter((b) => {
    if (filter.status && b.status !== filter.status) return false;

    const masuk = new Date(b.createdAt).toISOString().slice(0, 10);
    if (filter.dari && masuk < filter.dari) return false;
    // Perbandingan string tanggal ISO aman karena panjangnya tetap dan
    // urutan leksikografisnya sama dengan urutan kronologisnya.
    if (filter.sampai && masuk > filter.sampai) return false;

    return true;
  });
}

/**
 * Menyusun baris ekspor.
 *
 * `sertakanUang` mengikuti aturan peran yang sama dengan dasbor: angka
 * keuangan hanya untuk super admin. Perlu dikatakan jujur — ini bukan
 * pembatas keamanan yang ketat, karena admin biasa tetap dapat membuka
 * pesanan satu per satu dan melihat harganya. Yang dicegah adalah menyodorkan
 * rekap uang siap pakai kepada staf yang tidak memerlukannya.
 */
export function susunBaris(pesanan: Booking[], sertakanUang: boolean): BarisEkspor[] {
  return pesanan.map((b) => {
    const baris: BarisEkspor = {
      kode: b.bookingCode,
      masuk: tanggalRingkas(new Date(b.createdAt)),
      asal: b.source === 'manual' ? 'Manual' : 'Website',
      pelanggan: b.customerName,
      telepon: b.phone,
      pesanan: b.vehicleNameSnapshot ?? b.routeNameSnapshot ?? '—',
      mulai: tanggalRingkas(new Date(b.startDate)),
      selesai: b.endDate ? tanggalRingkas(new Date(b.endDate)) : '—',
      status: LABEL_STATUS[b.status] ?? b.status,
    };

    if (sertakanUang) {
      baris.total = b.totalPrice;
      baris.biayaPemasok = b.supplierCost;
      baris.margin =
        b.totalPrice !== null && b.supplierCost !== null ? b.totalPrice - b.supplierCost : null;
    }

    return baris;
  });
}

export type Kolom = { kunci: keyof BarisEkspor; judul: string; lebar: number; uang?: boolean };

export function kolomEkspor(sertakanUang: boolean): Kolom[] {
  const dasar: Kolom[] = [
    { kunci: 'kode', judul: 'Kode', lebar: 19 },
    { kunci: 'masuk', judul: 'Masuk', lebar: 11 },
    { kunci: 'asal', judul: 'Asal', lebar: 9 },
    { kunci: 'pelanggan', judul: 'Pelanggan', lebar: 21 },
    // Nomor telepon TIDAK boleh terpotong — ekspor ini dipakai untuk menelepon.
    { kunci: 'telepon', judul: 'WhatsApp', lebar: 17 },
    { kunci: 'pesanan', judul: 'Pesanan', lebar: 24 },
    { kunci: 'mulai', judul: 'Mulai', lebar: 11 },
    { kunci: 'selesai', judul: 'Selesai', lebar: 11 },
    { kunci: 'status', judul: 'Status', lebar: 13 },
  ];

  if (!sertakanUang) return dasar;

  return [
    ...dasar,
    { kunci: 'total', judul: 'Total', lebar: 15, uang: true },
    { kunci: 'biayaPemasok', judul: 'Biaya pemasok', lebar: 17, uang: true },
    { kunci: 'margin', judul: 'Margin', lebar: 15, uang: true },
  ];
}

/** Nama berkas memuat rentang tanggalnya, supaya unduhan lama tidak tertukar. */
export function namaBerkas(filter: FilterEkspor, ekstensi: string): string {
  const bagian = ['pesanan-lians'];
  if (filter.status) bagian.push(filter.status);
  if (filter.dari) bagian.push(filter.dari);
  if (filter.sampai) bagian.push(filter.sampai);
  if (!filter.dari && !filter.sampai) bagian.push(new Date().toISOString().slice(0, 10));
  return `${bagian.join('-')}.${ekstensi}`;
}
