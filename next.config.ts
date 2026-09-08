import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Regla para el dominio principal
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
        // Regla para el www
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.arienzoliving.com',
          },
        ],
        destination: '/inicio/:path*',
      },
    ];
  },
};

export default nextConfig;
