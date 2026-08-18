import { describe, it, expect } from 'vitest';
import { denganCapLogo, CAP_LOGO } from '@/lib/cap-logo';

const asli =
  'https://res.cloudinary.com/lians/image/upload/v1712345678/lians/kendaraan/innova.jpg';

describe('denganCapLogo', () => {
  it('menyisipkan lapisan logo tepat sesudah /upload/', () => {
    const hasil = denganCapLogo(asli);
    expect(hasil).toContain(`/image/upload/${CAP_LOGO}/`);
    // Segmen versi dan jalur berkasnya tidak boleh ikut tergeser atau hilang.
    expect(hasil).toContain('/v1712345678/lians/kendaraan/innova.jpg');
  });

  // Dipanggil dari kartu maupun galeri; keduanya bisa menerima URL yang sudah
  // pernah lewat sini. Cap ganda membuat logonya tercetak dua kali bertumpuk.
  it('tidak menumpuk cap bila dipanggil dua kali', () => {
    expect(denganCapLogo(denganCapLogo(asli))).toBe(denganCapLogo(asli));
  });

  // Data contoh dan kendaraan lama memakai URL dari luar Cloudinary. Menyisipkan
  // parameter Cloudinary ke sana hanya menghasilkan tautan gambar yang rusak.
  it('membiarkan URL dari luar Cloudinary apa adanya', () => {
    const luar = 'https://images.unsplash.com/photo-123?w=800';
    expect(denganCapLogo(luar)).toBe(luar);
  });

  it('membiarkan nilai kosong apa adanya', () => {
    expect(denganCapLogo('')).toBe('');
  });

  it('tetap bekerja pada URL yang sudah punya transformasi lain', () => {
    const sudah = 'https://res.cloudinary.com/lians/image/upload/w_800,q_auto/v1/a/b.jpg';
    const hasil = denganCapLogo(sudah);
    expect(hasil).toContain(`/image/upload/${CAP_LOGO}/w_800,q_auto/`);
  });
});
