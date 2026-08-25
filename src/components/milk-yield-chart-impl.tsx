"use client";

import { useTranslations } from "next-intl";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MilkDailyPoint } from "@/lib/milk-stats";
import { ChartFrame, chartAxis, chartGrid, chartTooltip } from "@/components/chart-frame";

// Recharts iceren asil grafik; wrapper tarafindan tembel yuklenir.
export function MilkYieldChartImpl({ data }: { data: MilkDailyPoint[] }) {
  const t = useTranslations("Animals");

  return (
    <ChartFrame heightClass="h-64" title={t("milkChartTitle", { count: data.length })}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="label" {...chartAxis} />
          <YAxis unit=" L" width={48} {...chartAxis} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)} L`} {...chartTooltip} />
          <Line
            type="monotone"
            dataKey="amount"
            name={t("milkUnit")}
            stroke="var(--chart-milk)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
