// WEB /app/sitemap.ts
import type { MetadataRoute } from "next";

const base = "https://www.rentback.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${base}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/sign-in`, lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/privacy`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/terms`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/contact`, lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/founder`, lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
