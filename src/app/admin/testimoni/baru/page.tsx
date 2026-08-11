import { TestimonialForm } from '@/components/admin/TestimonialForm';
import { createTestimonial } from '@/actions/admin-testimonials';
import { requireAdminPage } from '@/actions/auth-guard';

export const dynamic = 'force-dynamic';

export default async function TestimoniBaruPage() {
  await requireAdminPage();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black">Tambah Testimoni</h1>
      <TestimonialForm testimonial={null} onSubmit={createTestimonial} />
    </div>
  );
}
