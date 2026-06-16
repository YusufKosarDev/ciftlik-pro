import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// Icerik Guvenligi Politikasi (CSP).
// - script-src: Next.js calistirma onyukleme (bootstrap) icin 'unsafe-inline'
//   gerekir; gelistirmede React Fast Refresh icin ayrica 'unsafe-eval'.
// - style-src: Tailwind ve Next inline stilleri icin 'unsafe-inline'.
// - img-src: hayvan gorselleri serbest dis https URL olabildiginden https: ve
//   data: (inline SVG/ikon) izinli.
// - frame-ancestors 'none': clickjacking'e karsi (X-Frame-Options ile birlikte).
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
]
  .join("; ");

// Tum yanitlara uygulanan guvenlik basliklari.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HTTPS zorunlulugu (yerel http'de tarayicilar yok sayar).
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Clickjacking korumasi (eski tarayicilar icin; modern karsiligi frame-ancestors).
  { key: "X-Frame-Options", value: "DENY" },
  // MIME-sniffing engellenir.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Referer bilgisini sizdirma.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Kullanilmayan tarayici ozellikleri kapatilir.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  // Docker icin kucuk, bagimsiz calisabilir cikti uretir.
  output: "standalone",

  async headers() {
    return [
      {
        // Tum yollara uygula.
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
