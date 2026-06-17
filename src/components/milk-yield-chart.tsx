"use client";

import dynamic from "next/dynamic";
import type { MilkDailyPoint } from "@/lib/milk-stats";
import { ChartSkeleton } from "@/components/chart-skeleton";

// Recharts tembel (ssr:false) yuklenir; ilk JS yuku kucuk kalir.
const MilkYieldChartImpl = dynamic(
  () => import("./milk-yield-chart-impl").then((m) => m.MilkYieldChartImpl),
  {
    ssr: false,
    loading: () => <ChartSkeleton heightClass="h-64" title="Günlük Süt Verimi" />,
  }
);

export function MilkYieldChart({ data }: { data: MilkDailyPoint[] }) {
  return <MilkYieldChartImpl data={data} />;
}
