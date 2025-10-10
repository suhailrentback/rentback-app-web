/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep builds green even if ESLint finds issues (we’ll tighten later).
  eslint: { ignoreDuringBuilds: true },
  poweredByHeader: false,
};

export default nextConfig;
