// WEB: /app/robots.ts  (indexable)
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = "https://rentback.app";
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
