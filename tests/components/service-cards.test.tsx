import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ServiceCards } from '@/components/home/ServiceCards';

describe('ServiceCards', () => {
  it('menampilkan tiga lini usaha LIANS', () => {
    render(<ServiceCards locale="id" />);
    expect(screen.getByRole('link', { name: /Rental Mobil/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tiket Pesawat/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Paket Tour/ })).toBeInTheDocument();
  });

  // Yang paling mudah terlewat saat mengganti judul: tautannya tetap menuju
  // halaman lama. Kartu "Tiket Pesawat" yang membuka form booking mobil adalah
  // jalan buntu yang tidak memberi tahu pengunjung bahwa ia salah tempat.
  it('menautkan setiap kartu ke halaman lini usahanya', () => {
    render(<ServiceCards locale="id" />);
    expect(screen.getByRole('link', { name: /Rental Mobil/ })).toHaveAttribute('href', '/mobil');
    expect(screen.getByRole('link', { name: /Tiket Pesawat/ })).toHaveAttribute('href', '/tiket');
    expect(screen.getByRole('link', { name: /Paket Tour/ })).toHaveAttribute('href', '/tours');
  });

  it('menerjemahkan judul dan memberi awalan bahasa pada tautan', () => {
    render(<ServiceCards locale="en" />);
    expect(screen.getByRole('link', { name: /Ticketing/ })).toHaveAttribute('href', '/en/tiket');
  });

  // Kartu dan bilah atas menyebut hal yang sama, jadi harus memakai kata yang
  // sama. Penyebutan yang berbeda-beda membuat pengunjung mengira keduanya
  // menuju dua layanan yang berlainan.
  it('memakai penyebutan yang sama dengan label menu', () => {
    render(<ServiceCards locale="en" />);
    for (const judul of ['Car Rental', 'Ticketing', 'Tours']) {
      expect(screen.getByRole('link', { name: new RegExp(judul) })).toBeInTheDocument();
    }
  });

  // Ketiga kartu memakai satu daftar ikon dan tautan untuk semua bahasa. Judul
  // yang tertinggal di satu bahasa berarti ikon pesawat bertuliskan "dengan
  // sopir" — rusak, bukan sekadar belum diterjemahkan.
  it('mengganti judul di keempat bahasa, bukan hanya Indonesia', () => {
    for (const [locale, judul] of [
      ['ko', '항공권'],
      ['zh', '机票'],
    ] as const) {
      const { unmount } = render(<ServiceCards locale={locale} />);
      expect(screen.getByRole('link', { name: new RegExp(judul) })).toBeInTheDocument();
      unmount();
    }
  });
});
