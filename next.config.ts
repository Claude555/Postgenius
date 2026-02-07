import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  swcMinify: true,
  
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
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