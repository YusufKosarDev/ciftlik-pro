"use client";

import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/chart-skeleton";

type Item = { category: string; total: number };

const FinanceDonutChartImpl = dynamic(
  () => import("./finance-donut-chart-impl").then((m) => m.FinanceDonutChartImpl),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-4 md:grid-cols-2">
        <ChartSkeleton heightClass="h-80" title="Gelir Kategori Dağılımı" />
        <ChartSkeleton heightClass="h-80" title="Gider Kategori Dağılımı" />
      </div>
    ),
  }
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
