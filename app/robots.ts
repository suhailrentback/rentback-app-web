// WEB /app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: "https://www.rentback.app/sitemap.xml",
    host: "https://www.rentback.app",
  };
}
