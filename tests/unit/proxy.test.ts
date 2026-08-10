import { describe, it, expect } from 'vitest';
import { resolveHost } from '@/lib/host';

describe('resolveHost', () => {
  it('menulis-ulang admin.lians.id ke grup rute admin', () => {
    expect(resolveHost('admin.lians.id', '/')).toEqual({ kind: 'admin', rewriteTo: '/admin' });
  });

  it('mempertahankan sisa path saat menulis-ulang', () => {
    expect(resolveHost('admin.lians.id', '/armada')).toEqual({
      kind: 'admin',
      rewriteTo: '/admin/armada',
    });
  });

  it('mengenali subdomain admin saat pengembangan lokal', () => {
    expect(resolveHost('admin.localhost:3000', '/booking')).toEqual({
      kind: 'admin',
      rewriteTo: '/admin/booking',
    });
  });

  it('melewatkan permintaan situs publik apa adanya', () => {
    expect(resolveHost('lians.id', '/mobil')).toEqual({ kind: 'public' });
  });

  it('memblokir /admin bila diakses dari domain publik', () => {
    expect(resolveHost('lians.id', '/admin/armada')).toEqual({ kind: 'blocked' });
  });

  it('tidak menulis-ulang dua kali bila path sudah diawali /admin', () => {
    expect(resolveHost('admin.lians.id', '/admin/armada')).toEqual({ kind: 'blocked' });
  });

  it('mengarahkan /login pada host admin ke rute login tanpa penjaga', () => {
    expect(resolveHost('admin.lians.id', '/login')).toEqual({ kind: 'admin', rewriteTo: '/login' });
  });

  it('memblokir /login dari domain publik', () => {
    expect(resolveHost('lians.id', '/login')).toEqual({ kind: 'blocked' });
  });

  it('tidak tertipu hostname yang hanya mengandung kata admin', () => {
    expect(resolveHost('administrasi.lians.id', '/mobil')).toEqual({ kind: 'public' });
    expect(resolveHost('lians.id.admin.jahat.com', '/mobil')).toEqual({ kind: 'public' });
  });

  it('mengabaikan beda huruf besar-kecil pada hostname', () => {
    expect(resolveHost('ADMIN.LIANS.ID', '/armada')).toEqual({
      kind: 'admin',
      rewriteTo: '/admin/armada',
    });
  });
});
