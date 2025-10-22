// apps/web/next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure App Router is enabled
  experimental: {},

  // Monaco Editor webpack configuration
  webpack: (config, { isServer }) => {
    // Monaco editor uses web workers which need special handling
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // Handle Monaco Editor assets
    config.module.rules.push({
      test: /\.ttf$/,
      type: 'asset/resource'
    });

    return config;
  },

  // Transpile packages from monorepo
  transpilePackages: ['@aict/services', '@aict/database', '@aict/ui'],

  // Environment variables exposed to browser
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // Production optimizations
  swcMinify: true,
  reactStrictMode: true,

  // Image optimization
  images: {
    domains: [],
  },
};

module.exports = nextConfig;