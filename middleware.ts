import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  const { data: { session } } = await supabase.auth.getSession();

  // Si no hay sesión y NO están en la página de login, los mandamos al login
  if (!session && !req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Si ya hay sesión y están en la página de login, los mandamos a donde sea tu panel (ej: /crm)
  if (session && req.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/crm', req.url));
  }

  return res;
}

// Este matcher es el más potente, bloquea todo excepto lo técnico y el login
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};