// WEB: /app/opengraph-image.tsx  (dynamic OG image; no UI impact)
import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background: "#0b0b0b",
          color: "#ffffff",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#10B981"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 11.5L12 4l9 7.5" />
            <path d="M5 10v9h14v-9" />
          </svg>
          <span style={{ fontSize: 64, fontWeight: 800 }}>RentBack</span>
        </div>
        <div style={{ marginTop: 12, fontSize: 28, opacity: 0.9 }}>
          Pay rent. Earn rewards.
        </div>
      </div>
    ),
    { ...size }
  );
}
