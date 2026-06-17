"use client";

import dynamic from "next/dynamic";
import type { MonthlyFinance } from "@/lib/finance";
import { ChartSkeleton } from "@/components/chart-skeleton";

// Recharts agir bir paket. Grafigi yalnizca istemcide ve tembel yukluyoruz
// (ssr:false); boylece sayfanin ilk JS yuku kucuk kalir, grafik mount olunca
// recharts indirilir. Yuklenirken ayni yukseklikte iskelet gosterilir.
const MonthlyFinanceChartImpl = dynamic(
  () => import("./monthly-finance-chart-impl").then((m) => m.MonthlyFinanceChartImpl),
  {
    ssr: false,
    loading: () => <ChartSkeleton heightClass="h-72" title="Aylik Gelir - Gider (son 6 ay)" />,
  }
);

export function MonthlyFinanceChart({ data }: { data: MonthlyFinance[] }) {
  return <MonthlyFinanceChartImpl data={data} />;
}
