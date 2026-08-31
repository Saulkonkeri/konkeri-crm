import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  // 1. Detectamos por qué "puerta" entra el usuario (Verificamos ambas cabeceras por si Vercel las cambia)
  const hostname = request.headers.get('host') || request.headers.get('x-forwarded-host') || '';
  const isArienzoDomain = hostname.includes('reserva.arienzoliving.com');

  // 2. MAGIA: Si entra por el dominio de Arienzo a la raíz ("/"), 
  // le inyectamos la página "/reserva" inmediatamente y lo dejamos pasar.
  if (isArienzoDomain && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/reserva';
    return NextResponse.rewrite(url);
  }

  // 3. FLUJO NORMAL DEL CRM (Para los que NO entran por Arienzo)
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 4. Seguridad: Mandar al login si intentan entrar sin permiso al CRM
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    !request.nextUrl.pathname.startsWith('/reserva') &&
    !request.nextUrl.pathname.startsWith('/api') &&
    !isArienzoDomain
  ) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}