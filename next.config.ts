import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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