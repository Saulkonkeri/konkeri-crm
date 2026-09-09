import { NextResponse, type NextRequest } from 'next/server';
// Importamos tu guardia de seguridad de Supabase para el CRM
import { updateSession } from './supabase/middleware';

export async function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. REGLA PARA LA LANDING: Si entran por arienzoliving.com, desviamos a /inicio sin pedir clave
  if (hostname === 'arienzoliving.com' || hostname === 'www.arienzoliving.com') {
    if (!url.pathname.startsWith('/inicio')) {
      return NextResponse.rewrite(new URL(`/inicio${url.pathname}`, request.url));
    }
  }

  // 2. REGLA PARA EL CRM: Si es reserva... o sistema..., pasa por el guardia de Supabase
  return await updateSession(request);
}

export const config = {
  // Mantenemos exactamente tu misma configuración de exclusión del CRM
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
