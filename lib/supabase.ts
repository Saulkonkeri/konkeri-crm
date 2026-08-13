import { createBrowserClient } from '@supabase/ssr';

// Al usar createBrowserClient, Next.js y Supabase guardan tu sesión como Cookie automáticamente
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);