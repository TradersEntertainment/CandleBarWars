import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.externals.push('pino-pretty', 'lokijs', 'encoding');
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },

};

export default nextConfig;
