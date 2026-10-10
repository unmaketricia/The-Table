import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// This is iOS's dedicated Home Screen icon. A full-bleed, opaque
// square lets iOS apply its own corner mask without double-rounding.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#254b3a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
          fontWeight: 700,
        }}
      >
        <div style={{ display: "flex", fontSize: 32, letterSpacing: 3, lineHeight: 1.12 }}>
          THE
        </div>
        <div style={{ display: "flex", fontSize: 36, lineHeight: 1.12, marginTop: 4 }}>
          TABLE
        </div>
        <div
          style={{
            display: "flex",
            width: 92,
            height: 5,
            marginTop: 12,
            borderRadius: 3,
            backgroundColor: "#f4e5b9",
          }}
        />
      </div>
    ),
    size,
  );
}
