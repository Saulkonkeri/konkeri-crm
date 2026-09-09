import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Si entra a arienzoliving.com, lo mandamos a la landing (carpeta /inicio)
  if (hostname === 'arienzoliving.com' || hostname === 'www.arienzoliving.com') {
    if (!url.pathname.startsWith('/inicio')) {
      return NextResponse.rewrite(new URL(`/inicio${url.pathname}`, request.url));
    }
  }

  // 2. Si entra a reserva... o sistema..., lo dejamos pasar normal al CRM
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};