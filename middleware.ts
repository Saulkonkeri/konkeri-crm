import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.nextUrl.hostname || '';
  const pathname = request.nextUrl.pathname;
  
  const isReservaDomain = hostname.includes('reserva.arienzoliving.com');
  const isMainDomain = hostname === 'arienzoliving.com' || hostname === 'www.arienzoliving.com';

  // ==========================================
  // 1. BARRERAS DE DOMINIOS CRUZADOS (NUEVO)
  // ==========================================
  
  // Si están en el subdominio de reserva pero buscan la landing o acceso, los mandamos al dominio oficial
  if (isReservaDomain && (pathname.startsWith('/inicio') || pathname.startsWith('/acceso'))) {
    // Si buscaban /inicio, los mandamos a la raíz limpia de arienzoliving.com
    const destino = pathname.startsWith('/inicio') ? '/' : pathname;
    return NextResponse.redirect(`https://arienzoliving.com${destino}`);
  }

  // Si están en el dominio principal pero buscan el inventario o login, los mandamos al subdominio oficial
  if (isMainDomain && (pathname.startsWith('/reserva') || pathname.startsWith('/login'))) {
    return NextResponse.redirect(`https://reserva.arienzoliving.com${pathname}`);
  }

  // ==========================================
  // 2. INYECCIÓN DE RUTAS RAÍZ ("/")
  // ==========================================
  
  // Si entran a reserva.arienzoliving.com directo, inyectamos la carpeta /reserva
  if (isReservaDomain && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/reserva';
    return NextResponse.rewrite(url);
  }

  // Si entran a arienzoliving.com directo, inyectamos la carpeta /inicio (tu landing)
  if (isMainDomain && pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/inicio';
    return NextResponse.rewrite(url);
  }

  // ==========================================
  // 3. SEGURIDAD SUPABASE
  // ==========================================
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

  const isPublicRoute = 
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/reserva') ||
    pathname.startsWith('/acceso') || 
    pathname.startsWith('/inicio') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    isMainDomain; 

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

// OPTIMIZACIÓN DE VELOCIDAD
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
