"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ChartSkeleton } from "@/components/chart-skeleton";

type Item = { category: string; total: number };

function DonutLoading() {
  const t = useTranslations("Finance");
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <ChartSkeleton heightClass="h-80" title={t("incomeBreakdownTitle")} />
      <ChartSkeleton heightClass="h-80" title={t("expenseBreakdownTitle")} />
    </div>
  );
}

const FinanceDonutChartImpl = dynamic(
  () => import("./finance-donut-chart-impl").then((m) => m.FinanceDonutChartImpl),
  { ssr: false, loading: DonutLoading }
);

export function FinanceDonutChart({
  incomeData,
  expenseData,
}: {
  incomeData: Item[];
  expenseData: Item[];
}) {
  return <FinanceDonutChartImpl incomeData={incomeData} expenseData={expenseData} />;
}
