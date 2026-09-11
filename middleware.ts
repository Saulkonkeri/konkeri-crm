import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Usamos nextUrl.hostname que es 100% exacto y no se deja engañar por Vercel
  const hostname = request.nextUrl.hostname || '';
  
  const isReservaDomain = hostname.includes('reserva.arienzoliving.com');
  const isMainDomain = hostname === 'arienzoliving.com' || hostname === 'www.arienzoliving.com';

  // 1. Si entran a reserva.arienzoliving.com directo, inyectamos la carpeta /reserva
  if (isReservaDomain && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/reserva';
    return NextResponse.rewrite(url);
  }

  // 2. Si entran a arienzoliving.com directo, inyectamos la carpeta /inicio (tu landing)
  if (isMainDomain && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    return NextResponse.rewrite(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // 3. LA LISTA BLANCA (Rutas de libre acceso)
  const isPublicRoute = 
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/auth') ||
    request.nextUrl.pathname.startsWith('/reserva') ||
    request.nextUrl.pathname.startsWith('/acceso') || // <-- RUTA SQUEEZE PAGE
    request.nextUrl.pathname.startsWith('/inicio') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next') ||
    isMainDomain; // Toda la landing y páginas de arienzoliving.com son públicas

  // 4. Protección final del CRM
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// 5. OPTIMIZACIÓN: Le decimos al middleware que ignore los archivos estáticos para que la web sea más rápida
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
