import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ManualBookingForm } from '@/components/admin/ManualBookingForm';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const armada = [{ id: '11111111-1111-4111-8111-111111111111', name: 'Innova Zenix G' }];
const kendaraanPemasok = [
  {
    id: '22222222-2222-4222-8222-222222222222',
    name: 'Hiace Pinjaman',
    supplierName: 'CV Sumber Jaya',
  },
];

function pasang(props: Partial<Parameters<typeof ManualBookingForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue({ ok: true, data: { id: 'x', bookingCode: 'LNS-1' } });
  render(
    <ManualBookingForm
      armada={armada}
      kendaraanPemasok={kendaraanPemasok}
      pelanggan={[]}
      onSubmit={onSubmit}
      {...props}
    />,
  );
  return onSubmit;
}

const isi = async (user: ReturnType<typeof userEvent.setup>, label: RegExp, nilai: string) => {
  const kolom = screen.getByLabelText(label);
  await user.clear(kolom);
  await user.type(kolom, nilai);
};

describe('ManualBookingForm — biaya operasional', () => {
  it('menampilkan isian biaya operasional untuk kendaraan milik LIANS', () => {
    pasang();
    expect(screen.getByLabelText(/bbm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sopir/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tol.*parkir/i)).toBeInTheDocument();
  });

  // Inti permintaannya: mobil pinjaman tidak membuat BBM jadi gratis.
  it('tetap menampilkan biaya operasional saat kendaraannya dari pemasok', async () => {
    const user = userEvent.setup();
    pasang();
    await user.click(screen.getByLabelText(/dari pemasok/i));

    expect(screen.getByLabelText(/biaya ke pemasok/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/bbm/i)).toBeInTheDocument();
  });

  it('mengurangi biaya operasional dari margin yang ditampilkan', async () => {
    const user = userEvent.setup();
    pasang();

    await isi(user, /total harga ke pelanggan/i, '2000000');
    await isi(user, /bbm/i, '400000');
    await isi(user, /biaya sopir/i, '250000');

    expect(await screen.findByTestId('margin')).toHaveTextContent('Rp 1.350.000');
  });

  it('mengurangi biaya pemasok dan biaya operasional sekaligus', async () => {
    const user = userEvent.setup();
    pasang();
    await user.click(screen.getByLabelText(/dari pemasok/i));

    await isi(user, /total harga ke pelanggan/i, '3600000');
    await isi(user, /biaya ke pemasok/i, '2000000');
    await isi(user, /bbm/i, '650000');

    expect(await screen.findByTestId('margin')).toHaveTextContent('Rp 950.000');
  });

  it('memperingatkan saat biayanya melampaui harga ke pelanggan', async () => {
    const user = userEvent.setup();
    pasang();

    await isi(user, /total harga ke pelanggan/i, '500000');
    await isi(user, /bbm/i, '800000');

    const margin = await screen.findByTestId('margin');
    expect(margin).toHaveTextContent('-Rp 300.000');
    expect(margin.className).toMatch(/red/);
  });
});

describe('ManualBookingForm — mode ubah', () => {
  it('mengisi form dengan nilai pesanan yang sedang diubah', () => {
    pasang({
      mode: 'ubah',
      awal: {
        customerName: 'Grace Tumbelaka',
        itemName: 'Hiace Commuter, 3 hari',
        totalPrice: 3600000,
        costFuel: 400000,
      },
    });

    expect(screen.getByLabelText(/^nama$/i)).toHaveValue('Grace Tumbelaka');
    expect(screen.getByLabelText(/^keterangan pesanan$/i)).toHaveValue('Hiace Commuter, 3 hari');
    expect(screen.getByLabelText(/bbm/i)).toHaveValue(400000);
  });

  it('menyebut tombolnya simpan perubahan, bukan simpan pesanan', () => {
    pasang({ mode: 'ubah' });
    expect(screen.getByRole('button', { name: /simpan perubahan/i })).toBeInTheDocument();
  });

  it('tetap menyebut simpan pesanan pada mode catat baru', () => {
    pasang();
    expect(screen.getByRole('button', { name: /simpan pesanan/i })).toBeInTheDocument();
  });
});
