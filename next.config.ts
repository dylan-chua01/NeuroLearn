import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
        pathname: '/**', // Allow all paths from Clerk
      },
    ],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Exclude problematic modules from server-side bundle
      config.externals = config.externals || [];
      config.externals.push('canvas', 'jsdom');
    }
    
    // Handle pdf-parse module resolution
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdf-parse': require.resolve('pdf-parse')
    };
    
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse']
  }
};

export default nextConfig;
