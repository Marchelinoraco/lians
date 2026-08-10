import { v2 as cloudinary } from 'cloudinary';

// SDK membaca CLOUDINARY_URL (cloudinary://key:secret@cloud) secara otomatis.
// Satu variabel lebih aman daripada tiga: ketiganya tidak bisa saling salah
// pasang, kesalahan yang menghasilkan "cloud_name mismatch".

export const UPLOAD_FOLDER = 'lians/kendaraan';

export function cloudName(): string {
  const nama = cloudinary.config().cloud_name;
  if (!nama) throw new Error('CLOUDINARY_URL belum diatur di .env.local.');
  return nama;
}

export function apiKey(): string {
  const key = cloudinary.config().api_key;
  if (!key) throw new Error('CLOUDINARY_URL belum diatur di .env.local.');
  return key;
}

export function signUpload(params: Record<string, string | number>): string {
  const secret = cloudinary.config().api_secret;
  if (!secret) throw new Error('CLOUDINARY_URL belum diatur di .env.local.');
  return cloudinary.utils.api_sign_request(params, secret);
}

export async function destroyImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId);
}
