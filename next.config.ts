import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          // Regla de máxima prioridad para el dominio principal
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'arienzoliving.com',
            },
          ],
          destination: '/inicio/:path*',
        },
        {
          // Regla de máxima prioridad para el www
          source: '/:path*',
          has: [
            {
              type: 'host',
              value: 'www.arienzoliving.com',
            },
          ],
          destination: '/inicio/:path*',
        },
      ],
    };
  },
};

export default nextConfig;

