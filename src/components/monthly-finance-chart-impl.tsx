"use client";

import { useTranslations } from "next-intl";
import { useFormat } from "@/lib/format";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyFinance } from "@/lib/finance";
import { ChartFrame, chartAxis, chartGrid, chartTooltip } from "@/components/chart-frame";

// The real chart, the one that contains Recharts. It is loaded lazily (dynamic) by
// the wrapper, so the recharts bundle is only downloaded and run when the chart is
// actually needed on screen.
export function MonthlyFinanceChartImpl({ data }: { data: MonthlyFinance[] }) {
  const t = useTranslations("Finance");
  const { formatMoney } = useFormat();

  return (
    <ChartFrame heightClass="h-72" title={t("chartTitle")}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="month" {...chartAxis} />
          <YAxis {...chartAxis} />
          <Tooltip formatter={(value) => formatMoney(Number(value))} {...chartTooltip} />
          <Legend />
          <Bar
            dataKey="gelir"
            name={t("incomeBar")}
            fill="var(--chart-income)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="gider"
            name={t("expenseBar")}
            fill="var(--chart-expense)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
