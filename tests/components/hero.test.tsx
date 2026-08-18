import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { GalleryItem } from '@/db/schema';
import { Hero } from '@/components/home/Hero';

const foto = (n: number): GalleryItem =>
  ({
    id: `foto-${n}`,
    image: [{ url: `https://contoh.test/${n}.jpg`, publicId: `p${n}`, alt: `Foto ${n}` }],
    caption: { id: `Keterangan ${n}` },
    isPublished: true,
    sortOrder: n,
    createdAt: new Date('2026-01-01'),
  }) as GalleryItem;

const pasang = (galeri: GalleryItem[] = []) =>
  render(<Hero title="Judul Uji" subtitle="Subjudul uji." locale="id" galeri={galeri} />);

describe('Hero', () => {
  it('menampilkan judul dan subjudul', () => {
    // Diperiksa lewat textContent, bukan getByText: judul dan subjudul dipecah
    // per kata menjadi span-span terpisah supaya bisa naik berjenjang.
    const { container } = pasang();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Judul Uji');
    expect(container.textContent).toContain('Subjudul uji.');
  });

  it('menamai tombol armada dengan sebutan Indonesia yang dipakai LIANS', () => {
    pasang();
    expect(screen.getByRole('link', { name: 'Armada Kami' })).toHaveAttribute('href', '/mobil');
  });

  it('memakai sebutan yang sama untuk tombol armada dalam bahasa Inggris', () => {
    render(<Hero title="T" subtitle="S" locale="en" galeri={[]} />);
    expect(screen.getByRole('link', { name: 'Our Fleet' })).toHaveAttribute('href', '/en/mobil');
  });

  it('tidak lagi menampilkan pil daerah layanan', () => {
    pasang();
    expect(screen.queryByText(/Melayani Manado/)).not.toBeInTheDocument();
  });

  it('memakai foto galeri sebagai latar', () => {
    pasang([1, 2, 3, 4, 5, 6].map(foto));
    expect(screen.getAllByRole('presentation', { hidden: true })).toHaveLength(6);
  });

  // Enam foto = satu putaran penuh. Foto ketujuh dan seterusnya hanya menambah
  // unduhan tanpa pernah terlihat, karena putarannya sudah tetap enam takuk.
  it('memakai enam foto pertama bila galerinya lebih panjang', () => {
    pasang([1, 2, 3, 4, 5, 6, 7, 8].map(foto));
    const latar = screen.getAllByRole('presentation', { hidden: true });
    expect(latar).toHaveLength(6);
    expect(latar.map((el) => el.getAttribute('src')).join(' ')).not.toContain('7.jpg');
  });

  // Putarannya bertakuk enam. Galeri yang lebih pendek harus diulang, sebab
  // takuk yang tidak terisi menjadi jeda panjang tanpa gambar sama sekali.
  it('mengulang foto agar keenam takuk putaran selalu terisi', () => {
    pasang([foto(1), foto(2), foto(3)]);
    expect(screen.getAllByRole('presentation', { hidden: true })).toHaveLength(6);
  });

  // Galeri yang dikosongkan admin tidak boleh menyisakan hero tanpa latar
  // sama sekali — yang tampil harus tetap punya warna, bukan kotak putih.
  it('tetap tampil utuh saat galeri kosong', () => {
    pasang([]);
    expect(screen.queryAllByRole('presentation', { hidden: true })).toHaveLength(0);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('melewati butir galeri yang tidak punya berkas gambar', () => {
    const tanpaGambar = { ...foto(9), image: [] } as GalleryItem;
    pasang([foto(1), tanpaGambar, foto(2)]);
    const latar = screen.getAllByRole('presentation', { hidden: true });
    expect(latar.map((el) => el.getAttribute('src')).join(' ')).not.toContain('9.jpg');
  });
});
