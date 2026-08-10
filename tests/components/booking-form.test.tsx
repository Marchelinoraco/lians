import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BookingForm } from '@/components/booking/BookingForm';

const kendaraan = [
  {
    id: '11111111-1111-4111-8111-111111111111',
    slug: 'innova-zenix-g',
    name: 'Innova Zenix G',
    rate24h: 900000,
    rate12h: 650000,
    driverFeeOverride: null,
    status: 'available' as const,
  },
  {
    id: '22222222-2222-4222-8222-222222222222',
    slug: 'all-new-brio',
    name: 'All New Brio',
    rate24h: 350000,
    rate12h: null,
    driverFeeOverride: null,
    status: 'available' as const,
  },
];

const rute = [
  { id: '33333333-3333-4333-8333-333333333333', label: 'Manado → Bandara', price: 150000 },
  { id: '44444444-4444-4444-8444-444444444444', label: 'Manado → Likupang', price: null },
];

const render1 = (onSubmit = vi.fn()) =>
  render(
    <BookingForm
      vehicles={kendaraan}
      routes={rute}
      driverFeePerDay={150000}
      defaultVehicleSlug={null}
      defaultRouteId={null}
      onSubmit={onSubmit}
      locale="id"
    />,
  );

describe('BookingForm', () => {
  it('menampilkan perkiraan harga setelah kendaraan dan tanggal diisi', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-06');

    // Angka ini muncul dua kali: sebagai baris rincian dan sebagai total.
    expect(await screen.findAllByText(/Rp 4\.500\.000/)).toHaveLength(2);
  });

  it('menambahkan biaya sopir sesuai hari yang dipilih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-06');
    await user.clear(screen.getByLabelText(/hari pakai sopir/i));
    await user.type(screen.getByLabelText(/hari pakai sopir/i), '3');

    expect(await screen.findByText(/Rp 4\.950\.000/)).toBeInTheDocument();
  });

  it('menyembunyikan pilihan paket tarif untuk kendaraan tanpa tarif 12 jam', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[1].id);
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('memperingatkan bila hari sopir melebihi durasi sewa', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-03');
    await user.clear(screen.getByLabelText(/hari pakai sopir/i));
    await user.type(screen.getByLabelText(/hari pakai sopir/i), '9');

    expect(await screen.findByRole('alert')).toHaveTextContent(/tidak boleh lebih dari 2 hari/i);
  });

  it('menonaktifkan tombol kirim saat hari sopir berlebih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/kendaraan/i), kendaraan[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/tanggal selesai/i), '2099-08-03');
    await user.clear(screen.getByLabelText(/hari pakai sopir/i));
    await user.type(screen.getByLabelText(/hari pakai sopir/i), '9');

    expect(screen.getByRole('button', { name: /kirim pesanan/i })).toBeDisabled();
  });

  it('mengganti isian kendaraan dengan pilihan rute saat layanan travel dipilih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/jenis layanan/i), 'travel');
    expect(screen.getByLabelText(/rute/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/tanggal selesai/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/hari pakai sopir/i)).not.toBeInTheDocument();
  });

  it('menjelaskan tarif tetap saat rute bertarif dipilih', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/jenis layanan/i), 'travel');
    await user.selectOptions(screen.getByLabelText(/rute/i), rute[0].id);

    expect(await screen.findByText(/Tarif sekali jalan Rp 150\.000/)).toBeInTheDocument();
  });

  it('menjelaskan bahwa penawaran menyusul untuk rute tanpa tarif', async () => {
    const user = userEvent.setup();
    render1();

    await user.selectOptions(screen.getByLabelText(/jenis layanan/i), 'travel');
    await user.selectOptions(screen.getByLabelText(/rute/i), rute[1].id);

    expect(await screen.findByText(/belum bertarif tetap/i)).toBeInTheDocument();
  });

  it('mengirim payload travel tanpa endDate, rateType, dan dengan driverDays nol', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue({ ok: false, message: 'berhenti di sini' });
    render1(onSubmit);

    await user.selectOptions(screen.getByLabelText(/jenis layanan/i), 'travel');
    await user.selectOptions(screen.getByLabelText(/rute/i), rute[0].id);
    await user.type(screen.getByLabelText(/tanggal mulai/i), '2099-08-01');
    await user.type(screen.getByLabelText(/nama lengkap/i), 'Sari');
    await user.type(screen.getByLabelText(/nomor whatsapp/i), '081234567890');
    await user.click(screen.getByRole('button', { name: /kirim pesanan/i }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceType: 'travel',
        routeId: rute[0].id,
        driverDays: 0,
      }),
    );
    const payload = onSubmit.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).not.toHaveProperty('endDate');
    expect(payload).not.toHaveProperty('rateType');
  });
});
