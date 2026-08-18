import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/layout/Footer';
import { DEFAULT_SETTINGS } from '@/queries/settings';

describe('Footer', () => {
  it('menampilkan alamat LIANS di Manado', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    expect(screen.getByText(/Pomorow/)).toBeInTheDocument();
    expect(screen.getByText(/Manado 95125/)).toBeInTheDocument();
  });

  it('menampilkan seluruh tautan navigasi utama', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    for (const label of ['Beranda', 'Rental Mobil', 'Paket Tour', 'Tiket Pesawat', 'Kontak']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('tidak lagi menampilkan menu Travel maupun Booking', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    expect(screen.queryByRole('link', { name: 'Travel' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Booking' })).not.toBeInTheDocument();
  });

  it('menautkan WhatsApp ke nomor dari pengaturan', () => {
    render(
      <Footer settings={{ ...DEFAULT_SETTINGS, whatsappNumber: '081234567890' }} locale="id" />,
    );
    const tautan = screen.getByRole('link', { name: /whatsapp/i });
    expect(tautan).toHaveAttribute('href', expect.stringContaining('wa.me/6281234567890'));
  });

  it('menerjemahkan navigasi dan memberi awalan bahasa pada tautan', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="en" />);
    expect(screen.getByRole('link', { name: 'Vehicles' })).toHaveAttribute('href', '/en/mobil');
  });

  it('tidak memberi awalan pada tautan bahasa Indonesia', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    expect(screen.getByRole('link', { name: 'Rental Mobil' })).toHaveAttribute('href', '/mobil');
  });

  it('menampilkan jam operasional dalam bahasa yang diminta', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="ko" />);
    expect(screen.getByText(/매일/)).toBeInTheDocument();
  });

  it('jatuh ke bahasa Indonesia bila terjemahan jam operasional kosong', () => {
    const settings = { ...DEFAULT_SETTINGS, operatingHours: { id: 'Setiap hari' } };
    render(<Footer settings={settings} locale="zh" />);
    expect(screen.getByText('Setiap hari')).toBeInTheDocument();
  });

  it('menampilkan tahun berjalan pada catatan hak cipta', () => {
    render(<Footer settings={DEFAULT_SETTINGS} locale="id" />);
    expect(screen.getByText(new RegExp(String(new Date().getFullYear())))).toBeInTheDocument();
  });
});
