import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. Autorizamos a Next.js para optimizar las imágenes de tu base de datos
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijzqqbybubruthargcnq.supabase.co',
      },
    ],
  },
  // 2. Mantenemos intactas tus reglas de enrutamiento
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Interceptar SOLO la raíz exacta del dominio principal
          source: '/',
          has: [
            {
              type: 'host',
              value: 'arienzoliving.com',
            },
          ],
          destination: '/inicio',
        },
        {
          // Interceptar SOLO la raíz exacta con www
          source: '/',
          has: [
            {
              type: 'host',
              value: 'www.arienzoliving.com',
            },
          ],
          destination: '/inicio',
        },
      ],
    };
  },
};

export default nextConfig;