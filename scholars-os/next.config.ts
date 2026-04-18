import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    formats: ['image/webp', 'image/avif'],
  },
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  async redirects() {
    return [
      { source: '/logo.png', destination: '/static/logo.svg', permanent: false },
      { source: '/logo-static.png', destination: '/static/logo-static.svg', permanent: false },
    ]
  },
}

export default nextConfig
