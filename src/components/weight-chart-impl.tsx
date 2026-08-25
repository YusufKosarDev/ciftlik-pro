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
import type { WeightPoint } from "@/lib/weight-stats";
import { ChartFrame, chartAxis, chartGrid, chartTooltip } from "@/components/chart-frame";

// Recharts iceren asil grafik; wrapper tarafindan tembel yuklenir.
export function WeightChartImpl({ data }: { data: WeightPoint[] }) {
  const t = useTranslations("Animals");

  return (
    <ChartFrame heightClass="h-64" title={t("weightChartTitle")}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid {...chartGrid} />
          <XAxis dataKey="label" {...chartAxis} />
          <YAxis unit=" kg" width={52} domain={["auto", "auto"]} {...chartAxis} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)} kg`} {...chartTooltip} />
          <Line
            type="monotone"
            dataKey="weight"
            name={t("weightSeries")}
            stroke="var(--chart-weight)"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
