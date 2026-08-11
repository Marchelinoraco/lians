import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { testimonials } from '@/db/schema';
import { TestimonialForm } from '@/components/admin/TestimonialForm';
import { DeleteButton } from '@/components/admin/DeleteButton';
import { updateTestimonial, deleteTestimonial } from '@/actions/admin-testimonials';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function TestimoniEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();

  const { id } = await params;
  const [testimonial] = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.id, id))
    .limit(1);
  if (!testimonial) notFound();

  async function simpan(input: unknown) {
    'use server';
    return updateTestimonial(id, input);
  }

  async function hapus() {
    'use server';
    return deleteTestimonial(id);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-black">Ubah testimoni: {testimonial.customerName}</h1>
        <DeleteButton
          onDelete={hapus}
          redirectTo="/testimoni"
          konfirmasi={`Hapus testimoni dari ${testimonial.customerName}?`}
        />
      </div>
      <TestimonialForm testimonial={testimonial} onSubmit={simpan} />
    </div>
  );
}
