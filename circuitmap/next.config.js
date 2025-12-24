/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker production builds
  output: 'standalone',
  images: {
    domains: ['localhost', 'minio', 'circuitmap-minio'],
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
