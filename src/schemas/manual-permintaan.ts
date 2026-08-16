import { z } from 'zod';
import { bidangPermintaanTur, periksaUrutanTanggalTur } from './tour-request';
import { bidangPermintaanTiket, periksaRuteDanTanggal } from './ticket-request';

/**
 * Permintaan tur dan tiket yang dicatat staf, bukan yang masuk lewat situs.
 *
 * Aturan isiannya sama persis dengan form publik — nomor telepon, tanggal,
 * jumlah orang. Yang ditambahkan hanya dua hal yang memang tidak ada di sisi
 * pengunjung:
 *
 *   status      Permintaan yang ditelepon bisa saja sudah disepakati saat itu
 *               juga. Berbeda dari booking manual yang selalu 'confirmed',
 *               permintaan tetap berbawaan 'pending': ini permintaan
 *               penawaran, dan harganya sering baru dibicarakan kemudian.
 *   adminNotes  Catatan internal — "minta harga rombongan", "tunggu kabar
 *               tanggal pasti" — yang tidak pernah dilihat pelanggan.
 */
const status = z.enum(['pending', 'confirmed', 'completed', 'cancelled']).default('pending');
const catatanInternal = z.string().max(2000).optional();

export const manualTourRequestSchema = z
  .object({ ...bidangPermintaanTur, status, adminNotes: catatanInternal })
  .superRefine(periksaUrutanTanggalTur);

export const manualTicketRequestSchema = z
  .object({ ...bidangPermintaanTiket, status, adminNotes: catatanInternal })
  .superRefine(periksaRuteDanTanggal);

export type ManualTourRequestInput = z.infer<typeof manualTourRequestSchema>;
export type ManualTicketRequestInput = z.infer<typeof manualTicketRequestSchema>;
