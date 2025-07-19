import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is now stable
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production'
  }
}

export default nextConfig