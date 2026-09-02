"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { MonthlyFinance } from "@/lib/finance";
import { ChartSkeleton } from "@/components/chart-skeleton";

function MonthlyFinanceLoading() {
  const t = useTranslations("Finance");
  return <ChartSkeleton heightClass="h-72" title={t("chartTitle")} />;
}

// Recharts is a heavy package. The chart is loaded on the client only and lazily
// (ssr:false), so the page's initial JS payload stays small and recharts is fetched
// when the chart mounts. A skeleton of the same height is shown meanwhile.
const MonthlyFinanceChartImpl = dynamic(
  () => import("./monthly-finance-chart-impl").then((m) => m.MonthlyFinanceChartImpl),
  { ssr: false, loading: MonthlyFinanceLoading }
);

export function MonthlyFinanceChart({ data }: { data: MonthlyFinance[] }) {
  return <MonthlyFinanceChartImpl data={data} />;
}
