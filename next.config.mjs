// next.config.mjs
/** @type {import('next').NextConfig} */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseHost = (() => {
  try {
    const u = new URL(supabaseUrl);
    return u.host;
  } catch {
    return "";
  }
})();

// Tight but pragmatic CSP for Next.js + Supabase
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  // Next.js/React sometimes needs eval in dev; not in prod. We keep it off.
  "script-src 'self'",
  [
    "connect-src 'self'",
    supabaseHost ? `https://${supabaseHost}` : "",
    supabaseHost ? `wss://${supabaseHost}` : "",
  ]
    .filter(Boolean)
    .join(" "),
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
  { key: "Content-Security-Policy", value: csp },
];

const nextConfig = {
  reactStrictMode: false,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
