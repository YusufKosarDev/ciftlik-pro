"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import type { MilkDailyPoint } from "@/lib/milk-stats";
import { ChartSkeleton } from "@/components/chart-skeleton";

// Yukleme iskeleti de cevrilir. `loading` bir React bileseni olarak render
// edildiginden hook kullanabilir; onceden sabit Turkce metin gecildigi icin
// EN'e gecildiginde iskelet Turkce kaliyordu.
function MilkChartLoading() {
  const t = useTranslations("Animals");
  return <ChartSkeleton heightClass="h-64" title={t("milkChartLabel")} />;
}

// Recharts tembel (ssr:false) yuklenir; ilk JS yuku kucuk kalir.
const MilkYieldChartImpl = dynamic(
  () => import("./milk-yield-chart-impl").then((m) => m.MilkYieldChartImpl),
  { ssr: false, loading: MilkChartLoading }
);

export function MilkYieldChart({ data }: { data: MilkDailyPoint[] }) {
  return <MilkYieldChartImpl data={data} />;
}
