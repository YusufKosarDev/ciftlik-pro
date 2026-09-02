"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { MilkDailyPoint } from "@/lib/milk-stats";
import { ChartSkeleton } from "@/components/chart-skeleton";

// The loading skeleton is translated too. `loading` is rendered as a React
// component, so it may use hooks; it previously received hard-coded Turkish text,
// which left the skeleton in Turkish after switching to English.
function MilkChartLoading() {
  const t = useTranslations("Animals");
  return <ChartSkeleton heightClass="h-64" title={t("milkChartLabel")} />;
}

// Recharts is loaded lazily (ssr:false), which keeps the initial JS payload small.
const MilkYieldChartImpl = dynamic(
  () => import("./milk-yield-chart-impl").then((m) => m.MilkYieldChartImpl),
  { ssr: false, loading: MilkChartLoading }
);

export function MilkYieldChart({ data }: { data: MilkDailyPoint[] }) {
  return <MilkYieldChartImpl data={data} />;
}
