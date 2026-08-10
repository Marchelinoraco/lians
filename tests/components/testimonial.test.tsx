import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestimonialCard } from '@/components/testimonial/TestimonialCard';
import type { Testimonial } from '@/db/schema';

const testimoni = {
  id: '44444444-4444-4444-8444-444444444444',
  customerName: 'Rina M.',
  rating: 5,
  reviewText: { id: 'Mobil bersih dan tepat waktu.', en: 'Clean car and on time.' },
  vehicleName: 'Innova Reborn',
  date: '2026-06-12',
  isFeatured: true,
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Testimonial;

describe('TestimonialCard', () => {
  it('menampilkan nama, ulasan, dan kendaraan', () => {
    render(<TestimonialCard testimonial={testimoni} locale="id" />);
    expect(screen.getByText('Rina M.')).toBeInTheDocument();
    expect(screen.getByText(/Mobil bersih/)).toBeInTheDocument();
    expect(screen.getByText(/Innova Reborn/)).toBeInTheDocument();
  });

  it('menyatakan rating sebagai teks yang bisa dibaca pembaca layar', () => {
    render(<TestimonialCard testimonial={testimoni} locale="id" />);
    expect(screen.getByLabelText('Rating 5 dari 5')).toBeInTheDocument();
  });

  it('menampilkan tanggal dalam format Indonesia', () => {
    render(<TestimonialCard testimonial={testimoni} locale="id" />);
    expect(screen.getByText('12 Juni 2026')).toBeInTheDocument();
  });

  it('menampilkan ulasan dan tanggal sesuai bahasa yang diminta', () => {
    render(<TestimonialCard testimonial={testimoni} locale="en" />);
    expect(screen.getByText(/Clean car and on time/)).toBeInTheDocument();
    expect(screen.getByText('12 June 2026')).toBeInTheDocument();
  });

  it('jatuh ke ulasan bahasa Indonesia bila terjemahan belum ada', () => {
    render(<TestimonialCard testimonial={testimoni} locale="ko" />);
    expect(screen.getByText(/Mobil bersih/)).toBeInTheDocument();
  });

  it('tidak menerjemahkan nama pelanggan', () => {
    render(<TestimonialCard testimonial={testimoni} locale="zh" />);
    expect(screen.getByText('Rina M.')).toBeInTheDocument();
  });

  it('menerjemahkan label rating', () => {
    render(<TestimonialCard testimonial={{ ...testimoni, rating: 4 }} locale="ko" />);
    expect(screen.getByLabelText('5점 만점에 4점')).toBeInTheDocument();
  });

  it('menyembunyikan baris kendaraan bila kosong', () => {
    render(<TestimonialCard testimonial={{ ...testimoni, vehicleName: null }} locale="id" />);
    expect(screen.queryByText(/Innova Reborn/)).not.toBeInTheDocument();
  });
});
