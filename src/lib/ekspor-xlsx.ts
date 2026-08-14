import ExcelJS from 'exceljs';
import type { BarisEkspor, Kolom } from './ekspor-pesanan';

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
): Promise<Buffer> {
  const buku = new ExcelJS.Workbook();
  buku.creator = 'LIANS';
  buku.created = new Date();

  const lembar = buku.addWorksheet('Pesanan', {
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

  if (sertakanUang && baris.length > 0) {
    const total = lembar.addRow({
      status: 'TOTAL',
      total: baris.reduce((n, b) => n + (b.total ?? 0), 0),
      biayaPemasok: baris.reduce((n, b) => n + (b.biayaPemasok ?? 0), 0),
      margin: baris.reduce((n, b) => n + (b.margin ?? 0), 0),
    });
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
