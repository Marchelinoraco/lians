import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VehicleCard } from '@/components/vehicle/VehicleCard';
import { VehicleGrid } from '@/components/vehicle/VehicleGrid';
import type { Vehicle } from '@/db/schema';

const dasar = {
  id: '11111111-1111-4111-8111-111111111111',
  slug: 'innova-zenix-g',
  name: 'Innova Zenix G',
  category: 'mpv',
  images: [],
  rateLepasKunci: 900000,
  ratePelayanan: 1300000,
  serviceTypes: ['self-drive', 'with-driver'],
  seats: 7,
  transmission: 'automatic',
  fuelType: 'petrol',
  year: 2024,
  luggage: 3,
  features: { id: ['AC Dingin'], en: ['Cold AC'] },
  rentalTerms: { id: [] },
  status: 'available',
  isPublished: true,
  sortOrder: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as Vehicle;

describe('VehicleCard', () => {
  it('menampilkan nama dan kedua tarif dalam rupiah', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByText('Innova Zenix G')).toBeInTheDocument();
    expect(screen.getByText(/Rp 900\.000/)).toBeInTheDocument();
    expect(screen.getByText(/Rp 1\.300\.000/)).toBeInTheDocument();
  });

  it('menampilkan label kedua kategori bila tarifnya diisi', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByText('Lepas kunci')).toBeInTheDocument();
    expect(screen.getByText('Pelayanan')).toBeInTheDocument();
  });

  it('menyembunyikan kategori yang tarifnya tidak diisi admin', () => {
    render(<VehicleCard vehicle={{ ...dasar, rateLepasKunci: null }} locale="id" />);
    expect(screen.queryByText('Lepas kunci')).not.toBeInTheDocument();
    expect(screen.getByText('Pelayanan')).toBeInTheDocument();
  });

  it('menyembunyikan kategori pelayanan bila tarifnya kosong', () => {
    render(<VehicleCard vehicle={{ ...dasar, ratePelayanan: null }} locale="id" />);
    expect(screen.getByText('Lepas kunci')).toBeInTheDocument();
    expect(screen.queryByText('Pelayanan')).not.toBeInTheDocument();
  });

  it('menautkan ke halaman detail kendaraan', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByRole('link', { name: /Innova Zenix G/ })).toHaveAttribute(
      'href',
      '/mobil/innova-zenix-g',
    );
  });

  it('memberi awalan bahasa pada tautan detail', () => {
    render(<VehicleCard vehicle={dasar} locale="zh" />);
    expect(screen.getByRole('link', { name: /Innova Zenix G/ })).toHaveAttribute(
      'href',
      '/zh/mobil/innova-zenix-g',
    );
  });

  it('menandai kendaraan yang sedang tidak tersedia', () => {
    render(<VehicleCard vehicle={{ ...dasar, status: 'unavailable' }} locale="id" />);
    expect(screen.getByText(/sedang tersewa/i)).toBeInTheDocument();
  });

  it('menerjemahkan label kategori dan satuan tarif', () => {
    render(<VehicleCard vehicle={dasar} locale="en" />);
    expect(screen.getByText('Self-drive')).toBeInTheDocument();
    expect(screen.getAllByText('per day').length).toBeGreaterThan(0);
  });

  it('tidak menerjemahkan nama kendaraan', () => {
    render(<VehicleCard vehicle={dasar} locale="ko" />);
    expect(screen.getByText('Innova Zenix G')).toBeInTheDocument();
  });

  it('menampilkan penanda saat foto belum ada', () => {
    render(<VehicleCard vehicle={dasar} locale="id" />);
    expect(screen.getByText(/foto menyusul/i)).toBeInTheDocument();
  });
});

describe('VehicleGrid', () => {
  it('menampilkan pesan ramah saat tidak ada yang cocok', () => {
    render(<VehicleGrid vehicles={[]} locale="id" />);
    expect(screen.getByText(/tidak ada kendaraan yang cocok/i)).toBeInTheDocument();
  });

  it('menerjemahkan pesan kosong', () => {
    render(<VehicleGrid vehicles={[]} locale="en" />);
    expect(screen.getByText(/no vehicles match/i)).toBeInTheDocument();
  });

  it('menampilkan satu kartu per kendaraan', () => {
    render(<VehicleGrid vehicles={[dasar, { ...dasar, id: 'lain', slug: 'brio', name: 'Brio' }]} locale="id" />);
    expect(screen.getAllByRole('article')).toHaveLength(2);
  });
});
