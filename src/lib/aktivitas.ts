import { db } from '@/db';
import { activityLog } from '@/db/schema';
import { sesiSekarang } from '@/actions/auth-guard';

export type CatatanAktivitas = {
  /** Slug bertingkat seperti "pesanan.buat". */
  aksi: string;
  /** Satu kalimat yang dapat dibaca tanpa membuka apa pun. */
  ringkasan: string;
  entitas?: string;
  entitasId?: string;
};

/**
 * Menuliskan satu baris riwayat. Tidak pernah melempar galat.
 *
 * Pencatatan tidak boleh menjatuhkan pekerjaan yang dicatatnya: pesanan yang
 * sudah tersimpan di database tidak boleh dilaporkan gagal kepada admin hanya
 * karena baris riwayatnya tidak jadi ditulis. Riwayat yang hilang itu kerugian
 * kecil; pesanan yang diketik ulang karena mengira gagal, kerugian besar.
 *
 * Dipanggil SETELAH perubahannya berhasil, bukan sebelum — riwayat tidak boleh
 * memuat hal yang ternyata batal terjadi.
 */
export async function catatAktivitas(input: CatatanAktivitas): Promise<void> {
  try {
    const sesi = await sesiSekarang();
    if (!sesi) return;

    await db.insert(activityLog).values({
      userId: sesi.id,
      userEmailSnapshot: sesi.email,
      action: input.aksi,
      summary: input.ringkasan,
      entity: input.entitas ?? null,
      entityId: input.entitasId ?? null,
    });
  } catch {
    // Sengaja dibiarkan diam. Lihat penjelasan di atas.
  }
}
