import { NextResponse, type NextRequest } from 'next/server';
import { getTicketRequests } from '@/queries/ticket-requests';
import { sesiSekarang } from '@/actions/auth-guard';
import { namaBerkas, type FilterEkspor } from '@/lib/ekspor-pesanan';
import { susunBarisTiket, KOLOM_TIKET, KONTEKS_TIKET } from '@/lib/ekspor-permintaan';
import { saringPermintaan } from '@/lib/saring-permintaan';
import { berkasXlsx } from '@/lib/ekspor-xlsx';
import { berkasPdf } from '@/lib/ekspor-pdf';

// exceljs dan pdfkit membaca berkas dari disk saat dijalankan, jadi keduanya
// tidak boleh ikut dipaketkan bundler. Runtime Node diminta secara eksplisit.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STATUS_SAH = ['pending', 'confirmed', 'completed', 'cancelled'];
const TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Mengunduh daftar permintaan tiket sebagai Excel atau PDF.
 *
 * Route Handler TIDAK dilindungi layout admin — layout hanya membungkus
 * halaman. Tanpa pemeriksaan sesi di sini, siapa pun yang menebak alamatnya
 * dapat mengunduh seluruh daftar pelanggan berikut nomor teleponnya.
 */
export async function GET(req: NextRequest) {
  const sesi = await sesiSekarang();
  if (!sesi) {
    return NextResponse.json({ pesan: 'Sesi tidak valid.' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams;
  const format = q.get('format') === 'pdf' ? 'pdf' : 'xlsx';

  const status = q.get('status');
  const dari = q.get('dari');
  const sampai = q.get('sampai');

  const filter: FilterEkspor = {
    status: status && STATUS_SAH.includes(status) ? status : undefined,
    dari: dari && TANGGAL.test(dari) ? dari : undefined,
    sampai: sampai && TANGGAL.test(sampai) ? sampai : undefined,
  };

  const semua = await getTicketRequests();
  const baris = susunBarisTiket(saringPermintaan(semua, filter));

  // Tanpa kolom rupiah, jadi tidak ada yang bergantung pada peran.
  const berkas =
    format === 'pdf'
      ? await berkasPdf(baris, KOLOM_TIKET, filter, false, KONTEKS_TIKET)
      : await berkasXlsx(baris, KOLOM_TIKET, false, KONTEKS_TIKET);

  return new NextResponse(new Uint8Array(berkas), {
    headers: {
      'Content-Type':
        format === 'pdf'
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${namaBerkas(filter, format).replace('pesanan-lians', 'permintaan-tiket-lians')}"`,
      // Berkas berisi data pelanggan; jangan disimpan perantara mana pun.
      'Cache-Control': 'no-store, private',
    },
  });
}
