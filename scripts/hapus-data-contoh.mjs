/**
 * Menghapus semua yang dibuat scripts/isi-data-contoh.mjs.
 *
 * Setiap penghapusan dibatasi penandanya masing-masing — tidak ada satu pun
 * perintah di sini yang bisa mengenai catatan asli, bahkan bila dijalankan di
 * basis data yang sudah berisi pesanan sungguhan. Itu sebabnya penghapusnya
 * ditulis lebih dulu: data contoh tanpa jalan keluar akan menempel selamanya.
 *
 * Urutannya penting. Pesanan dihapus sebelum pelanggan dan pemasok, karena
 * pesanan menunjuk keduanya.
 *
 * Jalankan: node --env-file=.env.local scripts/hapus-data-contoh.mjs
 */
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function utama() {
  const pesanan = await sql.query(
    "delete from bookings where booking_code like 'LNS-CONTOH-%' returning id",
  );
  const tur = await sql.query(
    "delete from tour_requests where request_code like 'TUR-CONTOH-%' returning id",
  );
  const tiket = await sql.query(
    "delete from ticket_requests where request_code like 'TKT-CONTOH-%' returning id",
  );

  // Kendaraan pemasok ikut terhapus lewat onDelete: cascade.
  const pemasok = await sql.query(
    "delete from suppliers where notes like '[DATA CONTOH]%' returning id",
  );
  const pelanggan = await sql.query(
    "delete from customers where email like '%@contoh.invalid' returning id",
  );

  console.log(`pesanan       : ${pesanan.length} dihapus`);
  console.log(`permintaan tur: ${tur.length} dihapus`);
  console.log(`permintaan tkt: ${tiket.length} dihapus`);
  console.log(`pemasok       : ${pemasok.length} dihapus`);
  console.log(`pelanggan     : ${pelanggan.length} dihapus`);

  // Pemeriksaan penutup: kalau ada sisa, penandanya tidak cocok dan itu perlu
  // diketahui sekarang, bukan berbulan-bulan kemudian saat rekapnya aneh.
  const sisa = await sql.query(
    `select
       (select count(*)::int from bookings where booking_code like 'LNS-CONTOH-%') as pesanan,
       (select count(*)::int from customers where email like '%@contoh.invalid') as pelanggan,
       (select count(*)::int from suppliers where notes like '[DATA CONTOH]%') as pemasok`,
  );
  const total = sisa[0].pesanan + sisa[0].pelanggan + sisa[0].pemasok;
  console.log(total === 0 ? '\nBersih.' : `\nMASIH TERSISA: ${JSON.stringify(sisa[0])}`);
  if (total !== 0) process.exit(1);
}

utama().catch((galat) => {
  console.error(galat);
  process.exit(1);
});
