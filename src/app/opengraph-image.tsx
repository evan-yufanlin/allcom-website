import { ImageResponse } from "next/og";

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
          alignItems: "flex-start",
          background: "#F7F7FB",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="110" height="70" viewBox="0 0 96 60" style={{ marginBottom: 36 }}>
          <path d="M 16,48 Q 26,30 36,48" fill="none" stroke="#DC2626" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M 28,48 Q 48,2 68,48" fill="none" stroke="#14141F" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M 60,48 Q 70,30 80,48" fill="none" stroke="#4338CA" strokeWidth="7.5" strokeLinecap="round" />
        </svg>
        <div style={{ display: "flex", alignItems: "baseline", gap: 18 }}>
          <div style={{ fontSize: 72, fontWeight: 800, color: "#14141F" }}>汎德</div>
          <div style={{ fontSize: 28, fontWeight: 600, color: "#5C5F72", letterSpacing: 4 }}>
            ALLCOM
          </div>
        </div>
        <div style={{ fontSize: 34, color: "#4338CA", fontWeight: 700, marginTop: 28 }}>
          機電系統的規劃者與監造者
        </div>
        <div style={{ fontSize: 24, color: "#5C5F72", marginTop: 14 }}>
          電機・空調・給排水・消防　規劃設計與監造
        </div>
      </div>
    ),
    { ...size }
  );
}
