import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouteCard } from '@/components/travel/RouteCard';
import type { TravelRoute } from '@/db/schema';

const rute = {
  id: '33333333-3333-4333-8333-333333333333',
  origin: 'Manado',
  destination: 'Bandara Sam Ratulangi',
  price: 150000,
  vehicleNote: { id: 'Avanza / Xenia' },
  estimatedDuration: { id: '30 menit' },
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as TravelRoute;

describe('RouteCard', () => {
  it('menampilkan asal dan tujuan', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByText(/Manado/)).toBeInTheDocument();
    expect(screen.getByText(/Bandara Sam Ratulangi/)).toBeInTheDocument();
  });

  it('menampilkan tarif dalam rupiah bila tersedia', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByText(/Rp 150\.000/)).toBeInTheDocument();
  });

  it('mengganti tarif dengan ajakan menghubungi bila harga belum ditetapkan', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByText(/hubungi untuk harga/i)).toBeInTheDocument();
    expect(screen.queryByText(/Rp/)).not.toBeInTheDocument();
  });

  it('menautkan ke WhatsApp dengan pesan berisi nama rute', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" locale="id" />);
    const tautan = screen.getByRole('link', { name: /hubungi untuk harga/i });
    expect(tautan.getAttribute('href')).toContain('wa.me/6281234567890');
    expect(decodeURIComponent(tautan.getAttribute('href') ?? '')).toContain(
      'Bandara Sam Ratulangi',
    );
  });

  it('menautkan ke form booking bila rute sudah bertarif', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="id" />);
    expect(screen.getByRole('link', { name: /pesan/i })).toHaveAttribute(
      'href',
      `/booking?route=${rute.id}`,
    );
  });

  it('memberi awalan bahasa pada tautan booking', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="en" />);
    expect(screen.getByRole('link', { name: /book/i })).toHaveAttribute(
      'href',
      `/en/booking?route=${rute.id}`,
    );
  });

  it('menampilkan waktu tempuh dalam bahasa yang diminta', () => {
    const berbahasa = {
      ...rute,
      estimatedDuration: { id: '30 menit', en: '30 minutes', ko: '30분' },
    } as unknown as TravelRoute;
    render(<RouteCard route={berbahasa} whatsappNumber="081234567890" locale="ko" />);
    expect(screen.getByText(/30분/)).toBeInTheDocument();
  });

  it('jatuh ke bahasa Indonesia bila waktu tempuh belum diterjemahkan', () => {
    render(<RouteCard route={rute} whatsappNumber="081234567890" locale="zh" />);
    expect(screen.getByText(/30 menit/)).toBeInTheDocument();
  });

  it('menerjemahkan ajakan menghubungi ke bahasa lain', () => {
    render(<RouteCard route={{ ...rute, price: null }} whatsappNumber="081234567890" locale="en" />);
    expect(screen.getByText(/contact for price/i)).toBeInTheDocument();
  });

  it('menyembunyikan baris waktu tempuh dan catatan bila keduanya kosong', () => {
    const polos = {
      ...rute,
      estimatedDuration: null,
      vehicleNote: null,
    } as unknown as TravelRoute;
    render(<RouteCard route={polos} whatsappNumber="081234567890" locale="id" />);
    expect(screen.queryByText(/menit/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Avanza/)).not.toBeInTheDocument();
  });
});
