import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { normalizePhone } from '@/lib/whatsapp';

/**
 * Mencari pelanggan lewat nomor telepon ternormalisasi; membuat catatan baru
 * bila belum ada. Mengembalikan id pelanggan.
 *
 * Dipanggil dari setiap jalur pesanan masuk — website maupun booking manual —
 * sehingga daftar pelanggan terbangun sendiri tanpa admin mengetik ulang.
 *
 * Nama pada catatan pelanggan diperbarui ke yang terbaru, tetapi nama yang
 * tersimpan di dalam pesanan TIDAK ikut berubah: pesanan menyimpan salinannya
 * sendiri supaya riwayat tetap sesuai keadaan saat itu.
 */
export async function cocokkanAtauBuatPelanggan(data: {
  name: string;
  phone: string;
  email?: string | null;
}): Promise<string> {
  const phone = normalizePhone(data.phone);

  const [ada] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);

  if (ada) {
    await db
      .update(customers)
      .set({
        name: data.name,
        // Email lama dipertahankan bila yang baru kosong: pesanan berikutnya
        // yang tidak menyertakan email tidak boleh menghapus yang sudah ada.
        email: data.email || ada.email,
        updatedAt: new Date(),
      })
      .where(eq(customers.id, ada.id));
    return ada.id;
  }

  const [baru] = await db
    .insert(customers)
    .values({ name: data.name, phone, email: data.email || null })
    .returning({ id: customers.id });

  return baru.id;
}
