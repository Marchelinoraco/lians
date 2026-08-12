import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '@/components/booking/BookingForm';

const kendaraan = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'innova-zenix-g',
    name: 'Innova Zenix G',
    rateLepasKunci: 900000,
    ratePelayanan: 1300000,
    status: 'available' as const,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'hiace-commuter',
    name: 'Hiace Commuter',
    rateLepasKunci: null,
    ratePelayanan: 1500000,
    status: 'available' as const,
  },
];

const render1 = (onSubmit = vi.fn(), defaultVehicleSlug: string | null = null) =>
  render(
    <BookingForm
      vehicles={kendaraan}
      routes={[]}
      defaultVehicleSlug={defaultVehicleSlug}
      defaultRouteId={null}
      onSubmit={onSubmit}
      locale="id"
    />,
  );

async function isiTanggal(user: ReturnType<typeof userEvent.setup>, mulai: string, selesai: string) {
  await user.type(screen.getByLabelText(/tanggal mulai/i), mulai);
  await user.type(screen.getByLabelText(/tanggal selesai/i), selesai);
}

describe('BookingForm', () => {
  it('menghitung 15 sampai 17 sebagai 3 hari lepas kunci', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[0].id);
    await isiTanggal(user, '2099-08-15', '2099-08-17');

    expect(await screen.findAllByText(/Rp 2\.700\.000/)).not.toHaveLength(0);
  });

  it('memakai tarif pelayanan saat kategori itu dipilih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[0].id);
    await isiTanggal(user, '2099-08-15', '2099-08-17');
    await user.click(screen.getByRole('radio', { name: /pelayanan/i }));

    expect(await screen.findAllByText(/Rp 3\.900\.000/)).not.toHaveLength(0);
  });

  it('menghitung sewa satu hari untuk tanggal mulai dan selesai yang sama', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[0].id);
    await isiTanggal(user, '2099-08-15', '2099-08-15');

    expect(await screen.findAllByText(/Rp 900\.000/)).not.toHaveLength(0);
  });

  it('menampilkan kedua kategori bila kendaraan menyediakan keduanya', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[0].id);
    expect(screen.getByRole('radio', { name: /lepas kunci/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /pelayanan/i })).toBeInTheDocument();
  });

  it('menyembunyikan kategori yang tarifnya tidak diisi admin', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[1].id);
    expect(screen.queryByRole('radio', { name: /lepas kunci/i })).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /pelayanan/i })).toBeInTheDocument();
  });

  it('memakai kategori yang tersedia walau bawaan form lepas kunci', async () => {
    const user = userEvent.setup();
    render1();

    // Hiace tidak dilepas-kunci; perkiraan harga harus tetap muncul memakai
    // tarif pelayanan, bukan macet karena kategori bawaan tidak tersedia.
    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[1].id);
    await isiTanggal(user, '2099-08-15', '2099-08-16');

    expect(await screen.findAllByText(/Rp 3\.000\.000/)).not.toHaveLength(0);
  });

  it('tidak menampilkan pilihan kategori sebelum kendaraan dipilih', () => {
    render1();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('tidak lagi menawarkan jenis layanan antar-jemput', () => {
    render1();
    expect(screen.queryByRole('option', { name: /antar-jemput/i })).not.toBeInTheDocument();
  });

  it('mengirim rateCategory dan tidak lagi mengirim hari sopir', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, message: 'berhenti di sini' });
    render1(onSubmit);

    await user.selectOptions(screen.getByLabelText(/^kendaraan$/i), kendaraan[0].id);
    await isiTanggal(user, '2099-08-15', '2099-08-17');
    await user.type(screen.getByLabelText(/nama lengkap/i), 'Budi');
    await user.type(screen.getByLabelText(/nomor whatsapp/i), '081234567890');
    await user.click(screen.getByRole('button', { name: /kirim pesanan/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ rateCategory: 'lepas-kunci' }),
    );
    const payload = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('driverDays');
    expect(payload).not.toHaveProperty('rateType');
  });

  it('memilih kategori pelayanan sejak awal untuk kendaraan tanpa lepas kunci', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, message: 'berhenti' });
    render1(onSubmit, 'hiace-commuter');

    await isiTanggal(user, '2099-08-15', '2099-08-16');
    await user.type(screen.getByLabelText(/nama lengkap/i), 'Sari');
    await user.type(screen.getByLabelText(/nomor whatsapp/i), '081234567890');
    await user.click(screen.getByRole('button', { name: /kirim pesanan/i }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ rateCategory: 'pelayanan' }));
  });
});
