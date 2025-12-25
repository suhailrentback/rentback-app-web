/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  async headers() {
    const csp = [
      "default-src 'self';",
      "base-uri 'self';",
      "frame-ancestors 'none';",
      "img-src 'self' data: blob: https:;",
      "font-src 'self' data:;",
      "style-src 'self' 'unsafe-inline';",
      "script-src 'self' 'unsafe-eval';",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co;",
      "object-src 'none';",
      "form-action 'self';",
    ].join(' ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
        ],
      },
    ];
  },
};

export default nextConfig;
