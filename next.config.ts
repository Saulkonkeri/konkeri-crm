/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Regla para el dominio principal (Landing)
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
        // Regla para el dominio con www (Landing)
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.arienzoliving.com',
          },
        ],
        destination: '/inicio/:path*',
      }
    ];
  },
};

export default nextConfig;