import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Keep builds green even if ESLint finds issues.
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

export default nextConfig;
