import { describe, it, expect, vi, beforeEach } from 'vitest';

const authMock = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: authMock }));

const redirectMock = vi.fn(() => {
  throw new Error('REDIRECT');
});
vi.mock('next/navigation', () => ({ redirect: redirectMock }));

const {
  requireSession,
  requireAdminPage,
  requireSuperAdmin,
  requireSuperAdminPage,
  sesiSekarang,
  SesiTidakValidError,
} = await import('@/actions/auth-guard');

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

describe('requireSuperAdmin', () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
  });

  it('meneruskan super admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'bos@lians.id', role: 'super_admin' } });
    await expect(requireSuperAdmin()).resolves.toMatchObject({ id: 'u1', role: 'super_admin' });
  });

  it('menolak admin biasa', async () => {
    authMock.mockResolvedValue({ user: { id: 'u2', email: 'staf@lians.id', role: 'admin' } });
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('menolak sesi tanpa peran sama sekali', async () => {
    authMock.mockResolvedValue({ user: { id: 'u3', email: 'staf@lians.id' } });
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(SesiTidakValidError);
  });

  it('menolak tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSuperAdmin()).rejects.toBeInstanceOf(SesiTidakValidError);
  });
});

describe('requireSuperAdminPage', () => {
  beforeEach(() => {
    authMock.mockReset();
    redirectMock.mockClear();
  });

  it('meneruskan super admin tanpa mengalihkan', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'bos@lians.id', role: 'super_admin' } });
    await expect(requireSuperAdminPage()).resolves.toEqual({ id: 'u1', email: 'bos@lians.id' });
    expect(redirectMock).not.toHaveBeenCalled();
  });

  // Dialihkan ke dasbor, bukan ke login: sesinya sah, ia hanya tidak berhak
  // melihat halaman ini. Melemparnya ke login akan terasa seperti sesinya
  // kedaluwarsa dan membuatnya mencoba login berulang-ulang.
  it('mengalihkan admin biasa ke dasbor, bukan ke login', async () => {
    authMock.mockResolvedValue({ user: { id: 'u2', email: 'staf@lians.id', role: 'admin' } });
    await expect(requireSuperAdminPage()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/');
  });

  it('mengalihkan ke login bila tidak ada sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(requireSuperAdminPage()).rejects.toThrow('REDIRECT');
    expect(redirectMock).toHaveBeenCalledWith('/login');
  });
});

describe('sesiSekarang', () => {
  beforeEach(() => authMock.mockReset());

  it('mengembalikan identitas beserta perannya', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'bos@lians.id', role: 'super_admin' } });
    await expect(sesiSekarang()).resolves.toEqual({
      id: 'u1',
      email: 'bos@lians.id',
      role: 'super_admin',
    });
  });

  it('menganggap sesi tanpa peran sebagai admin biasa', async () => {
    authMock.mockResolvedValue({ user: { id: 'u1', email: 'staf@lians.id' } });
    await expect(sesiSekarang()).resolves.toMatchObject({ role: 'admin' });
  });

  it('mengembalikan null tanpa sesi', async () => {
    authMock.mockResolvedValue(null);
    await expect(sesiSekarang()).resolves.toBeNull();
  });
});
