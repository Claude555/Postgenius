import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  swcMinify: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  eslint: {
    // Warning: This allows production builds to successfully complete 
    // even if your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows production builds to successfully complete 
    // even if your project has TypeScript errors.
    ignoreBuildErrors: true,
  },

  // Apply types to the webpack function arguments
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;