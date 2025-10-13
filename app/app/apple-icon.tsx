// app/apple-icon.tsx  <-- add this in BOTH repos (web + admin)
import { ImageResponse } from "next/og";

export const runtime = "edge";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 32,
          background:
            "linear-gradient(135deg, #10B981 0%, #059669 60%, #064E3B 100%)",
          color: "white",
          fontSize: 72,
          fontWeight: 900,
          letterSpacing: 1.5,
          fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        RB
      </div>
    ),
    { width: 180, height: 180 }
  );
}
