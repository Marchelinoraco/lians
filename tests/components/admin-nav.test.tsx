import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));
vi.mock('next-auth/react', () => ({ signOut: vi.fn() }));

const { AdminNav } = await import('@/components/admin/AdminNav');

const pasang = (props = {}) =>
  render(<AdminNav email="admin@lians.id" pendingCount={5} superAdmin {...props} />);

const tombolMenu = () => screen.getByRole('button', { name: /buka menu/i });

describe('AdminNav di layar sempit', () => {
  it('menyediakan tombol menu dan memulai dengan laci tertutup', () => {
    pasang();
    expect(tombolMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('membuka laci saat tombol menu ditekan', async () => {
    const user = userEvent.setup();
    pasang();

    await user.click(tombolMenu());

    expect(screen.getByRole('button', { name: /tutup menu/i })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  // Tanpa ini, laci tetap menutupi halaman tujuan setelah pindah menu —
  // dan di ponsel itu berarti pengguna harus menutupnya sendiri setiap kali.
  it('menutup laci saat salah satu menu dipilih', async () => {
    const user = userEvent.setup();
    pasang();
    await user.click(tombolMenu());

    await user.click(screen.getByRole('link', { name: /booking/i }));

    expect(tombolMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('menutup laci saat tirai di belakangnya disentuh', async () => {
    const user = userEvent.setup();
    pasang();
    await user.click(tombolMenu());

    await user.click(screen.getByTestId('tirai-menu'));

    expect(tombolMenu()).toHaveAttribute('aria-expanded', 'false');
  });

  it('tidak memasang tirai selama laci tertutup', () => {
    pasang();
    expect(screen.queryByTestId('tirai-menu')).not.toBeInTheDocument();
  });

  // Lencana pesanan menunggu ada di dalam laci; di ponsel laci itu tertutup,
  // sehingga angkanya harus tetap terlihat dari bilah atas.
  it('menampilkan jumlah pesanan menunggu di bilah atas', () => {
    pasang();
    expect(screen.getByTestId('bilah-atas-admin')).toHaveTextContent('5');
  });
});
