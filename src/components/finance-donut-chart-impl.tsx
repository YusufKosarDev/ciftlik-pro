"use client";

import { useTranslations } from "next-intl";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useFormat } from "@/lib/format";
import { ChartFrame, chartTooltip, CHART_CATEGORICAL } from "@/components/chart-frame";

type Item = { category: string; total: number };

function Donut({
  title,
  data,
  formatMoney,
}: {
  title: string;
  data: Array<{ name: string; value: number }>;
  formatMoney: (value: number) => string;
}) {
  return (
    <ChartFrame heightClass="h-80" title={title}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={55}
            outerRadius={75}
            paddingAngle={4}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={CHART_CATEGORICAL[index % CHART_CATEGORICAL.length]}
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => formatMoney(Number(value))} {...chartTooltip} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: 11 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function FinanceDonutChartImpl({
  incomeData,
  expenseData,
}: {
  incomeData: Item[];
  expenseData: Item[];
}) {
  const t = useTranslations("Finance");
  const { formatMoney } = useFormat();

  const incomePieData = incomeData.map((d) => ({ name: d.category, value: d.total }));
  const expensePieData = expenseData.map((d) => ({ name: d.category, value: d.total }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {incomePieData.length > 0 && (
        <Donut title={t("incomeBreakdownTitle")} data={incomePieData} formatMoney={formatMoney} />
      )}
      {expensePieData.length > 0 && (
        <Donut title={t("expenseBreakdownTitle")} data={expensePieData} formatMoney={formatMoney} />
      )}
    </div>
  );
}
