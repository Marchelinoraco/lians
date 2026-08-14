import PDFDocument from 'pdfkit';
import type { BarisEkspor, Kolom, FilterEkspor } from './ekspor-pesanan';

function rupiah(n: number | null | undefined): string {
  if (n === null || n === undefined) return '—';
  return `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;
}

/**
 * Menyusun PDF berorientasi lanskap.
 *
 * Lanskap dipilih karena tabelnya lebar; pada A4 tegak, kolom pesanan dan
 * nama pelanggan terpotong dan berkasnya jadi tidak berguna untuk dilampirkan.
 */
export function berkasPdf(
  baris: BarisEkspor[],
  kolom: Kolom[],
  filter: FilterEkspor,
  sertakanUang: boolean,
): Promise<Buffer> {
  return new Promise((selesai, gagal) => {
    const doc = new PDFDocument({ size: 'A4', layout: 'landscape', margin: 36 });
    const potongan: Buffer[] = [];

    doc.on('data', (c: Buffer) => potongan.push(c));
    doc.on('end', () => selesai(Buffer.concat(potongan)));
    doc.on('error', gagal);

    const kiri = doc.page.margins.left;
    const lebarIsi = doc.page.width - kiri - doc.page.margins.right;

    doc.fontSize(16).font('Helvetica-Bold').text('Daftar Pesanan LIANS', kiri, 36);

    const keterangan: string[] = [];
    if (filter.dari || filter.sampai) {
      keterangan.push(`Periode ${filter.dari ?? 'awal'} sampai ${filter.sampai ?? 'sekarang'}`);
    }
    if (filter.status) keterangan.push(`Status: ${filter.status}`);
    keterangan.push(`${baris.length} pesanan`);
    keterangan.push(`Dicetak ${new Date().toLocaleDateString('id-ID')}`);

    doc.fontSize(9).font('Helvetica').fillColor('#64748b').text(keterangan.join(' · '));
    doc.fillColor('#000000').moveDown(0.8);

    // Lebar kolom dibagi menurut bobot yang sama dengan lebar di Excel,
    // sehingga kedua berkas terbaca mirip.
    const totalBobot = kolom.reduce((n, k) => n + k.lebar, 0);
    const lebarKolom = kolom.map((k) => (k.lebar / totalBobot) * lebarIsi);

    const tinggiBaris = 18;

    function tulisBaris(nilai: string[], tebal: boolean) {
      const y = doc.y;

      // Halaman baru bila sisa ruang tidak cukup untuk satu baris penuh.
      if (y + tinggiBaris > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }

      const atas = doc.y;
      let x = kiri;

      doc.font(tebal ? 'Helvetica-Bold' : 'Helvetica').fontSize(8);

      nilai.forEach((teks, i) => {
        doc.text(teks, x + 2, atas + 5, {
          width: lebarKolom[i] - 4,
          height: tinggiBaris,
          ellipsis: true,
          lineBreak: false,
        });
        x += lebarKolom[i];
      });

      doc
        .moveTo(kiri, atas + tinggiBaris)
        .lineTo(kiri + lebarIsi, atas + tinggiBaris)
        .strokeColor('#e2e8f0')
        .lineWidth(0.5)
        .stroke();

      doc.y = atas + tinggiBaris;
    }

    tulisBaris(
      kolom.map((k) => k.judul),
      true,
    );

    for (const b of baris) {
      tulisBaris(
        kolom.map((k) => {
          const nilai = b[k.kunci];
          if (k.uang) return rupiah(nilai as number | null);
          return String(nilai ?? '—');
        }),
        false,
      );
    }

    if (sertakanUang && baris.length > 0) {
      tulisBaris(
        kolom.map((k) => {
          if (k.kunci === 'status') return 'TOTAL';
          if (!k.uang) return '';
          return rupiah(baris.reduce((n, b) => n + ((b[k.kunci] as number | null) ?? 0), 0));
        }),
        true,
      );
    }

    if (baris.length === 0) {
      doc.moveDown(1).fontSize(10).fillColor('#64748b').text('Tidak ada pesanan pada filter ini.');
    }

    doc.end();
  });
}
