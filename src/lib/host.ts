export type HostResolution =
  | { kind: 'admin'; rewriteTo: string }
  | { kind: 'public' }
  | { kind: 'blocked' };

/**
 * Panel admin hanya hidup di subdomainnya. Path /admin dan /login dari domain
 * publik diblokir supaya tidak ada dua pintu masuk ke halaman yang sama.
 */
export function resolveHost(host: string, pathname: string): HostResolution {
  const hostname = host.split(':')[0].toLowerCase();
  // startsWith('admin.'), bukan includes('admin') — 'lians.id.admin.jahat.com'
  // tidak boleh lolos sebagai host admin.
  const isAdminHost = hostname === 'admin.localhost' || hostname.startsWith('admin.');

  if (pathname.startsWith('/admin')) return { kind: 'blocked' };

  if (!isAdminHost) {
    return pathname === '/login' ? { kind: 'blocked' } : { kind: 'public' };
  }

  // Halaman login punya rutenya sendiri di luar layout berpenjaga sesi.
  if (pathname === '/login') return { kind: 'admin', rewriteTo: '/login' };

  return { kind: 'admin', rewriteTo: pathname === '/' ? '/admin' : `/admin${pathname}` };
}
