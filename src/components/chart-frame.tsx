"use client";

import type { ReactNode } from "react";

// Tum grafiklerin ortak kabugu ve tema-bagli Recharts ayarlari.
//
// NEDEN: Grafikler daha once sabit renkler (#f0f0f0 izgara, #16a34a seri)
// kullaniyordu; koyu temada izgara neredeyse gorunmez, eksen yazilari okunmaz
// oluyordu. Renkler artik globals.css'teki --chart-* token'larindan geliyor ve
// tema degisince grafikler de doniyor.
//
// AYRICA: Eski kabuk `h-64` bir kutu icinde `<ResponsiveContainer height="82%">`
// kullaniyordu. Yuzde yukseklik, baslik ve padding hesaba katilmadigi icin
// olcum sirasinda -1 dondurup konsolu su uyariyla dolduruyordu:
//   "The width(-1) and height(-1) of chart should be greater than 0"
// Flex kolon + `min-h-0 flex-1` ile grafik alani gercek kalan yuksekligi alir.

export function ChartFrame({
  heightClass,
  title,
  children,
}: {
  heightClass: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${heightClass} flex w-full flex-col rounded-xl border border-border bg-card p-5`}
    >
      <h3 className="mb-4 shrink-0 font-semibold text-foreground">{title}</h3>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

// Eksen (cizgi + etiket) tema renklerine baglanir.
export const chartAxis = {
  fontSize: 12,
  stroke: "var(--chart-axis)",
  tick: { fill: "var(--chart-axis)" },
} as const;

export const chartGrid = {
  strokeDasharray: "3 3",
  stroke: "var(--chart-grid)",
} as const;

// Tooltip varsayilani beyaz zeminlidir; koyu temada kart yuzeyini kullanir.
export const chartTooltip = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
  itemStyle: { color: "var(--foreground)" },
} as const;

// Kategorik palet (donut). Token'lar globals.css'te light/dark icin ayri tanimli.
export const CHART_CATEGORICAL = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;
