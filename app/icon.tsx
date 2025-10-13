// app/icon.tsx  <-- add this in BOTH repos (web + admin)
import { ImageResponse } from "next/og";

export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#059669", // emerald-600
          color: "white",
          fontSize: 18,
          fontWeight: 800,
          letterSpacing: 0.5,
          fontFamily: "system-ui, Segoe UI, Roboto, Helvetica, Arial",
        }}
      >
        RB
      </div>
    ),
    { width: 32, height: 32 }
  );
}
