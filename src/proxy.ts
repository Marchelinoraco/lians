import { NextResponse, type NextRequest } from 'next/server';
import { resolveHost } from '@/lib/host';
import { toAppPath } from '@/i18n/locale-path';

/**
 * Sejak Next.js 16 berkas ini bernama proxy.ts (dulu middleware.ts) dan
 * fungsinya diekspor sebagai `proxy`. Perilakunya identik.
 */
export function proxy(req: NextRequest) {
  const hasil = resolveHost(req.headers.get('host') ?? '', req.nextUrl.pathname);

  if (hasil.kind === 'blocked') {
    return new NextResponse('Halaman tidak ditemukan', { status: 404 });
  }

  const url = req.nextUrl.clone();

  if (hasil.kind === 'admin') {
    url.pathname = hasil.rewriteTo;
    return NextResponse.rewrite(url);
  }

  // Sisi publik: setiap permintaan diarahkan ke segmen [locale].
  // /mobil → /id/mobil, /en/mobil → /en/mobil.
  url.pathname = toAppPath(req.nextUrl.pathname);
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|icon.png|.*\\..*).*)'],
};
