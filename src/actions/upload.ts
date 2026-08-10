'use server';

import { signUpload, cloudName, apiKey, UPLOAD_FOLDER } from '@/lib/cloudinary';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

export type UploadSignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

/**
 * Browser mengunggah langsung ke Cloudinary agar berkas tidak melewati fungsi
 * serverless — batas ukuran body dan waktu eksekusi jadi tidak relevan.
 * Tanda tangannya dibuat di server supaya orang luar tidak bisa menumpang
 * mengunggah ke akun Cloudinary LIANS.
 */
export async function getUploadSignature(): Promise<ActionResult<UploadSignature>> {
  try {
    await requireSession();
  } catch {
    return fail('Sesi tidak valid. Silakan login kembali.');
  }

  const timestamp = Math.floor(Date.now() / 1000);

  try {
    const signature = signUpload({ timestamp, folder: UPLOAD_FOLDER });
    return ok({
      signature,
      timestamp,
      apiKey: apiKey(),
      cloudName: cloudName(),
      folder: UPLOAD_FOLDER,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : 'Konfigurasi Cloudinary belum lengkap.');
  }
}
