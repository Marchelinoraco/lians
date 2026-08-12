'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { customers } from '@/db/schema';
import { customerInputSchema } from '@/schemas/customer';
import { normalizePhone } from '@/lib/whatsapp';
import { requireSession } from './auth-guard';
import { fail, ok, type ActionResult } from './result';

async function jaga(): Promise<string | null> {
  try {
    await requireSession();
    return null;
  } catch {
    return 'Sesi tidak valid. Silakan login kembali.';
  }
}

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const phone = normalizePhone(parsed.data.phone);

  // Diperiksa lebih dulu agar pesannya menyebut nama pemilik nomor. Batasan
  // unik di database tetap ada sebagai jaring terakhir.
  const [ada] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  if (ada) return fail(`Nomor ini sudah terdaftar atas nama ${ada.name}.`);

  const [row] = await db
    .insert(customers)
    .values({
      name: parsed.data.name,
      phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
    })
    .returning({ id: customers.id });

  revalidatePath('/pelanggan');
  return ok({ id: row.id });
}

export async function updateCustomer(
  id: string,
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  const parsed = customerInputSchema.safeParse(input);
  if (!parsed.success) {
    return fail(
      'Periksa kembali isian Anda.',
      parsed.error.flatten().fieldErrors as Record<string, string[]>,
    );
  }

  const phone = normalizePhone(parsed.data.phone);
  const [bentrok] = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  if (bentrok && bentrok.id !== id) {
    return fail(`Nomor ini sudah terdaftar atas nama ${bentrok.name}.`);
  }

  const [row] = await db
    .update(customers)
    .set({
      name: parsed.data.name,
      phone,
      email: parsed.data.email || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(eq(customers.id, id))
    .returning({ id: customers.id });

  if (!row) return fail('Pelanggan tidak ditemukan.');

  revalidatePath('/pelanggan');
  revalidatePath(`/pelanggan/${id}`);
  return ok({ id: row.id });
}

export async function deleteCustomer(id: string): Promise<ActionResult<{ id: string }>> {
  const galat = await jaga();
  if (galat) return fail(galat);

  // Pesanan menyimpan nama dan telepon sebagai salinan sendiri, dan tautannya
  // diatur set null. Menghapus pelanggan hanya melepas tautan itu — riwayat
  // pesanannya tetap terbaca utuh.
  const [row] = await db.delete(customers).where(eq(customers.id, id)).returning({
    id: customers.id,
  });
  if (!row) return fail('Pelanggan tidak ditemukan.');

  revalidatePath('/pelanggan');
  return ok({ id: row.id });
}
