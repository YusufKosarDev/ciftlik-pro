"use client";

import dynamic from "next/dynamic";
import type { WeightPoint } from "@/lib/weight-stats";
import { ChartSkeleton } from "@/components/chart-skeleton";

// Recharts tembel (ssr:false) yuklenir; ilk JS yuku kucuk kalir.
const WeightChartImpl = dynamic(
  () => import("./weight-chart-impl").then((m) => m.WeightChartImpl),
  {
    ssr: false,
    loading: () => <ChartSkeleton heightClass="h-64" title="Ağırlık Değişimi" />,
  }
);

export function WeightChart({ data }: { data: WeightPoint[] }) {
  return <WeightChartImpl data={data} />;
}
