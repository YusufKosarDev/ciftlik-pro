import { ImageResponse } from "next/og";

// Sosyal paylasim karti (link onizlemesi). Build sirasinda PNG'ye donusturulur.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Çiftlik Pro — Çiftlik Yönetim Sistemi";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #15803d 0%, #059669 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <svg width="150" height="150" viewBox="0 0 64 64" fill="none">
          <g stroke="#ffffff" strokeWidth={3.5} strokeLinecap="round">
            <path d="M32 56 V28" />
            <path d="M32 28 q-9 -3 -11 -12 q9 1 11 9" />
            <path d="M32 28 q9 -3 11 -12 q-9 1 -11 9" />
            <path d="M32 37 q-9 -3 -11 -12 q9 1 11 9" />
            <path d="M32 37 q9 -3 11 -12 q-9 1 -11 9" />
            <path d="M32 46 q-9 -3 -11 -12 q9 1 11 9" />
            <path d="M32 46 q9 -3 11 -12 q-9 1 -11 9" />
          </g>
        </svg>
        <div style={{ fontSize: 82, fontWeight: 800, marginTop: 24 }}>
          Çiftlik Pro
        </div>
        <div style={{ fontSize: 34, opacity: 0.92, marginTop: 12 }}>
          Çiftlik Yönetim Sistemi · RBAC · Next.js + Prisma
        </div>
      </div>
    ),
    { ...size }
  );
}
