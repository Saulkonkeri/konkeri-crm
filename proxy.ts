import { type NextRequest } from 'next/server';
// Apuntamos directamente a la carpeta supabase que está en la raíz
import { updateSession } from './supabase/middleware';

// ¡AQUÍ ESTÁ EL CAMBIO CLAVE! Se llama a la función "proxy"
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};