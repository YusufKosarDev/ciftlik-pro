"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { WeightPoint } from "@/lib/weight-stats";
import { ChartSkeleton } from "@/components/chart-skeleton";

function WeightChartLoading() {
  const t = useTranslations("Animals");
  return <ChartSkeleton heightClass="h-64" title={t("weightChartTitle")} />;
}

// Recharts tembel (ssr:false) yuklenir; ilk JS yuku kucuk kalir.
const WeightChartImpl = dynamic(
  () => import("./weight-chart-impl").then((m) => m.WeightChartImpl),
  { ssr: false, loading: WeightChartLoading }
);

export function WeightChart({ data }: { data: WeightPoint[] }) {
  return <WeightChartImpl data={data} />;
}
