/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only use standalone for Docker builds, not Vercel
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  images: {
    domains: ['localhost', 'minio', 'circuitmap-minio'],
    // Add Vercel's image optimization
    unoptimized: process.env.VERCEL !== '1',
  },
  // Redirect Chrome DevTools probes to prevent 404 triggering error page
  async rewrites() {
    return [
      {
        source: '/.well-known/:path*',
        destination: '/api/well-known',
      },
    ];
  },
  // Handle Konva's optional Node.js canvas dependency
  webpack: (config, { isServer }) => {
    // Konva tries to import 'canvas' for Node.js SSR, but we only use it client-side
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];

    // Also add resolve alias to stub the canvas module
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
    };

    return config;
  },
}

module.exports = nextConfig
