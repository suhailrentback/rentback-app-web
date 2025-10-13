// app/twitter-image.tsx  <-- add this in BOTH repos (web + admin)
import { ImageResponse } from "next/og";
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Reuse the same art as opengraph-image
export default function TwitterImage() {
  return fetch(new URL("./opengraph-image", import.meta.url))
    .then((res) => res.arrayBuffer())
    .then((buf) => new ImageResponse(buf as any, size));
}
