import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    optimizePackageImports: ['recharts'],
  },
  async redirects() {
    return [
      { source: '/logo.png', destination: '/static/logo.png', permanent: false },
      { source: '/logo-static.png', destination: '/static/logo-static.png', permanent: false },
    ]
  },
}

export default nextConfig
