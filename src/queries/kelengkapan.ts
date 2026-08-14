import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import { vehicles, posts, galleryItems, testimonials } from '@/db/schema';

export type Kekurangan = {
  /** Pesan untuk staf, sudah termasuk angkanya. */
  pesan: string;
  href: string;
  /** true bila membuat situs terlihat setengah jadi bagi pengunjung. */
  penting: boolean;
};

/**
 * Mendaftar isi yang masih kosong atau masih memakai contoh.
 *
 * Ada karena dasbor sebelumnya hanya menampilkan angka pesanan — dan saat
 * belum ada pesanan sama sekali, halaman itu kosong dan tidak memberi tahu
 * pemiliknya apa yang sebenarnya perlu dikerjakan. Padahal yang membuat situs
 * terlihat setengah jadi justru hal-hal ini.
 */
export async function hitungKekurangan(): Promise<Kekurangan[]> {
  const [armada] = await db
    .select({
      total: sql<number>`count(*)::int`,
      tanpaFoto: sql<number>`count(*) filter (where jsonb_array_length(${vehicles.images}) = 0)::int`,
      tanpaPelayanan: sql<number>`count(*) filter (where ${vehicles.ratePelayanan} is null)::int`,
    })
    .from(vehicles)
    .where(eq(vehicles.isPublished, true));

  const [artikel] = await db
    .select({
      terbit: sql<number>`count(*) filter (where ${posts.isPublished})::int`,
      draf: sql<number>`count(*) filter (where not ${posts.isPublished})::int`,
    })
    .from(posts);

  const [galeri] = await db
    .select({
      total: sql<number>`count(*)::int`,
      // Foto penanda yang dibuat skrip; jalurnya mengandung 'galeri-contoh'.
      contoh: sql<number>`count(*) filter (where ${galleryItems.image}::text like '%galeri-contoh%')::int`,
    })
    .from(galleryItems);

  const [ulasan] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(testimonials)
    .where(eq(testimonials.isPublished, true));

  const daftar: Kekurangan[] = [];

  if (armada.tanpaFoto > 0) {
    daftar.push({
      pesan: `${armada.tanpaFoto} dari ${armada.total} kendaraan belum ada fotonya`,
      href: '/armada',
      penting: true,
    });
  }

  if (armada.tanpaPelayanan > 0) {
    daftar.push({
      pesan: `${armada.tanpaPelayanan} kendaraan belum diisi tarif Pelayanan — yang tampil hanya Lepas kunci`,
      href: '/armada',
      penting: true,
    });
  }

  if (galeri.contoh > 0) {
    daftar.push({
      pesan: `${galeri.contoh} foto galeri masih memakai gambar contoh bertuliskan "CONTOH"`,
      href: '/galeri',
      penting: true,
    });
  }

  if (galeri.total === 0) {
    daftar.push({
      pesan: 'Galeri masih kosong, jadi bagiannya tidak tampil di situs',
      href: '/galeri',
      penting: false,
    });
  }

  if (ulasan.total === 0) {
    daftar.push({ pesan: 'Belum ada testimoni yang tayang', href: '/testimoni', penting: false });
  }

  if (artikel.draf > 0) {
    daftar.push({
      pesan: `${artikel.draf} artikel masih draf dan belum terbaca pengunjung`,
      href: '/blog',
      penting: false,
    });
  }

  if (artikel.terbit === 0) {
    daftar.push({ pesan: 'Belum ada artikel yang terbit', href: '/blog', penting: false });
  }

  return daftar;
}

/** Dipakai kartu ringkas di dasbor. */
export async function hitungIsiSitus() {
  const [armada] = await db
    .select({ n: sql<number>`count(*) filter (where ${vehicles.isPublished})::int` })
    .from(vehicles);
  const [artikel] = await db
    .select({ n: sql<number>`count(*) filter (where ${posts.isPublished})::int` })
    .from(posts);
  const [galeri] = await db
    .select({ n: sql<number>`count(*) filter (where ${galleryItems.isPublished})::int` })
    .from(galleryItems);

  return { armada: armada.n, artikel: artikel.n, galeri: galeri.n };
}
