import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output makes the Docker image small: node server.js with no node_modules copy.
  output: process.env.DOCKER_BUILD === '1' ? 'standalone' : undefined,
  // Hero images are served by our own /media route from the private S3 bucket.
  images: { unoptimized: true },
  // Flyer and photo uploads go through server actions; allow files up to 10 MB.
  experimental: { serverActions: { bodySizeLimit: '85mb' } },
  // Native module for drawing flyers; must not be bundled.
  serverExternalPackages: ['@napi-rs/canvas', '@libsql/client'],
  outputFileTracingIncludes: { '/admin/**': ['./public/fonts/**'] },
  async redirects() {
    const backend = process.env.BACKEND_ORIGIN?.replace(/\/$/, '');
    return backend ? [{ source: '/admin/:path*', destination: `${backend}/admin/:path*`, permanent: false }] : [];
  },
  async rewrites() {
    const backend = process.env.BACKEND_ORIGIN?.replace(/\/$/, '');
    return { beforeFiles: backend ? [
      { source: '/api/forms', destination: `${backend}/api/forms` },
      { source: '/media/:path*', destination: `${backend}/media/:path*` },
    ] : [] };
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
      { source: '/admin/:path*', headers: [{ key: 'Cache-Control', value: 'private, no-store' }] },
    ];
  },
};

export default nextConfig;
