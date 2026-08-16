import ExcelJS from 'exceljs';
import type { BarisEkspor, Kolom, KonteksEkspor } from './ekspor-pesanan';
import { KONTEKS_PESANAN } from './ekspor-pesanan';

/**
 * Menyusun berkas .xlsx sungguhan, bukan CSV.
 *
 * CSV terlihat lebih sederhana, tetapi Excel berbahasa Indonesia memakai titik
 * koma sebagai pemisah daftar — berkas CSV berkoma akan masuk ke satu kolom
 * dan harus dipisah manual tiap kali. Berkas xlsx tidak punya masalah itu, dan
 * angkanya tetap berupa angka sehingga bisa langsung dijumlahkan.
 */
export async function berkasXlsx(
  baris: BarisEkspor[],
  kolom: Kolom[],
  sertakanUang: boolean,
  konteks: KonteksEkspor = KONTEKS_PESANAN,
): Promise<Buffer> {
  const buku = new ExcelJS.Workbook();
  buku.creator = 'LIANS';
  buku.created = new Date();

  const lembar = buku.addWorksheet(konteks.lembar, {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  lembar.columns = kolom.map((k) => ({
    header: k.judul,
    key: k.kunci,
    width: k.lebar,
  }));

  lembar.getRow(1).font = { bold: true };
  lembar.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFEFF6FF' },
  };

  for (const b of baris) lembar.addRow(b);

  // Format rupiah dipasang pada kolomnya, bukan diketik ke dalam teks —
  // dengan begitu isinya tetap angka dan dapat dijumlahkan di Excel.
  for (const k of kolom) {
    if (!k.uang) continue;
    lembar.getColumn(k.kunci).numFmt = '"Rp"#,##0';
  }

  // Baris jumlah disusun dari kolom uang yang benar-benar ada, bukan dari
  // nama kolom yang ditulis tetap. Daftar lain punya kolom uang yang berbeda —
  // atau tidak punya sama sekali, dan baris totalnya memang tidak perlu ada.
  const kolomUang = kolom.filter((k) => k.uang);

  if (kolomUang.length > 0 && baris.length > 0) {
    const isi: Record<string, string | number> = {};

    // Labelnya ditaruh di kolom bukan-uang terakhir, tepat sebelum angkanya.
    const kolomLabel = [...kolom].reverse().find((k) => !k.uang);
    if (kolomLabel) isi[kolomLabel.kunci] = 'TOTAL';

    for (const k of kolomUang) {
      isi[k.kunci] = baris.reduce((n, b) => {
        const nilai = b[k.kunci];
        return n + (typeof nilai === 'number' ? nilai : 0);
      }, 0);
    }

    const total = lembar.addRow(isi);
    total.font = { bold: true };
    total.border = { top: { style: 'thin' } };
  }

  // Penyaring otomatis dipasang pada baris judul agar pemilik dapat menyaring
  // sendiri di Excel tanpa mengekspor ulang.
  lembar.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: kolom.length },
  };

  const buf = await buku.xlsx.writeBuffer();
  return Buffer.from(buf);
}
