import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack is now stable
  compiler: {
    // Remove console logs in production (except Eruda-related ones)
    // removeConsole: process.env.NODE_ENV === 'production' ? {
    //   exclude: ['error', 'warn']
    // } : false
  },
  
  // Ensure Eruda can be dynamically imported in all environments
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Allow dynamic imports for client-side debugging tools
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
      }
    }
    return config
  },
  
  // Environment variables for debugging
  env: {
    ERUDA_ENABLED: process.env.ERUDA_ENABLED || 'true',
  }
}

export default nextConfig