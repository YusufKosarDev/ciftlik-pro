"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { MonthlyFinance } from "@/lib/finance";
import { ChartSkeleton } from "@/components/chart-skeleton";

function MonthlyFinanceLoading() {
  const t = useTranslations("Finance");
  return <ChartSkeleton heightClass="h-72" title={t("chartTitle")} />;
}

// Recharts agir bir paket. Grafigi yalnizca istemcide ve tembel yukluyoruz
// (ssr:false); boylece sayfanin ilk JS yuku kucuk kalir, grafik mount olunca
// recharts indirilir. Yuklenirken ayni yukseklikte iskelet gosterilir.
const MonthlyFinanceChartImpl = dynamic(
  () => import("./monthly-finance-chart-impl").then((m) => m.MonthlyFinanceChartImpl),
  { ssr: false, loading: MonthlyFinanceLoading }
);

export function MonthlyFinanceChart({ data }: { data: MonthlyFinance[] }) {
  return <MonthlyFinanceChartImpl data={data} />;
}
