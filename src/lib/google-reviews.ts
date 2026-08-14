export type UlasanGoogle = {
  penulis: string;
  fotoPenulis: string | null;
  bintang: number;
  waktuRelatif: string;
  teks: string;
};

export type RingkasanUlasan = {
  rating: number;
  jumlahUlasan: number;
  tautanProfil: string;
  ulasan: UlasanGoogle[];
};

/**
 * Mengambil ulasan Google lewat Places API resmi.
 *
 * BUKAN dengan mengikis halaman hasil pencarian: Google memblokir pengambilan
 * otomatis, dan menyalin ulasan ke database sendiri berarti menayangkan
 * tulisan orang tanpa izin sekaligus membekukannya — ulasan yang kemudian
 * dihapus penulisnya akan tetap tampil di situs ini.
 *
 * Mengembalikan null bila kunci belum disetel atau permintaannya gagal.
 * Halaman yang memanggilnya menampilkan tautan ke profil Google saja, bukan
 * angka karangan. Beranda tidak pernah rusak hanya karena layanan luar mati.
 */
export async function ambilUlasanGoogle(): Promise<RingkasanUlasan | null> {
  const kunci = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;
  if (!kunci || !placeId) return null;

  const bidang = [
    'rating',
    'userRatingCount',
    'googleMapsUri',
    'reviews.authorAttribution',
    'reviews.rating',
    'reviews.relativePublishTimeDescription',
    'reviews.originalText',
    'reviews.text',
  ].join(',');

  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: { 'X-Goog-Api-Key': kunci, 'X-Goog-FieldMask': bidang },
      // Disimpan enam jam. Ulasan jarang berubah, dan setiap permintaan ke
      // Places API dihitung sebagai penggunaan berbayar.
      next: { revalidate: 21600 },
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      rating?: number;
      userRatingCount?: number;
      googleMapsUri?: string;
      reviews?: {
        authorAttribution?: { displayName?: string; photoUri?: string };
        rating?: number;
        relativePublishTimeDescription?: string;
        originalText?: { text?: string };
        text?: { text?: string };
      }[];
    };

    if (typeof data.rating !== 'number') return null;

    const ulasan: UlasanGoogle[] = (data.reviews ?? [])
      .map((r) => ({
        penulis: r.authorAttribution?.displayName ?? '',
        fotoPenulis: r.authorAttribution?.photoUri ?? null,
        bintang: r.rating ?? 0,
        waktuRelatif: r.relativePublishTimeDescription ?? '',
        // originalText adalah tulisan asli penulisnya; `text` bisa berupa
        // terjemahan otomatis Google. Yang asli lebih jujur ditampilkan.
        teks: (r.originalText?.text ?? r.text?.text ?? '').trim(),
      }))
      .filter((r) => r.penulis && r.teks);

    return {
      rating: data.rating,
      jumlahUlasan: data.userRatingCount ?? 0,
      tautanProfil: data.googleMapsUri ?? '',
      ulasan,
    };
  } catch {
    // Layanan luar yang sedang bermasalah tidak boleh menjatuhkan beranda.
    return null;
  }
}
