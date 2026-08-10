import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));

const redirectMock = vi.fn(() => {
  throw new Error('REDIRECT');
});
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

const { requireSession, requireAdminPage, SesiTidakValidError } = await import(
  '@/actions/auth-guard'
);

describe('requireSession', () => {
  beforeEach(() => authMock.mockReset());

  it('mengembalikan identitas pengguna bila sesi valid', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'admin@lians.id' } });
    await expect(requireSession()).resolves.toEqual({ id: 'u1', email: 'admin@lians.id' });
  });

  it('melempar bila tidak ada sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSession()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('melempar bila sesi ada tetapi tanpa id pengguna', async () => {
    authMock.mockResolvedValue({ user: {} });
    await expect(requireSession()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('mengembalikan email kosong bila sesi tidak membawa email', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1' } });
    await expect(requireSession()).resolves.toEqual({ id: 'u1', email: '' });
  });
});

describe('requireAdminPage', () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
  });

  it('meneruskan identitas bila sesi valid', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'admin@lians.id' } });
    await expect(requireAdminPage()).resolves.toEqual({ id: 'u1', email: 'admin@lians.id' });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  // Redirect di layout menghasilkan status 307 yang benar, tetapi tidak
  // menghentikan komponen halaman dari render. Tanpa penjaga di halaman,
  // kueri tetap berjalan dan angka ringkasan ikut terkirim dalam badan respons.
  it('mengalihkan ke /login bila tidak ada sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireAdminPage()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });

  it('mengalihkan bila sesi ada tetapi tanpa id pengguna', async () => {
    authMock.mockResolvedValue({ user: {} });
    await expect(requireAdminPage()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});
