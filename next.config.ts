import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 1. Autorizamos a Next.js para optimizar las imágenes de tu base de datos y forzamos formatos ultra ligeros (Para Google PageSpeed)
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ijzqqbybubruthargcnq.supabase.co',
        pathname: '/storage/v1/object/public/**',
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