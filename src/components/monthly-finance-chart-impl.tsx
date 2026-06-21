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

// Recharts iceren asil grafik. Wrapper tarafindan tembel (dynamic) yuklenir;
// boylece recharts paketi yalnizca grafik ekranda ihtiyac duyuldugunda in/calisir.
export function MonthlyFinanceChartImpl({ data }: { data: MonthlyFinance[] }) {
  const t = useTranslations("Finance");
  const { formatMoney } = useFormat();

  return (
    <div className="h-72 w-full rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-semibold text-foreground">
        {t("chartTitle")}
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip
            formatter={(value) => formatMoney(Number(value))}
          />
          <Legend />
          <Bar dataKey="gelir" name={t("incomeBar")} fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gider" name={t("expenseBar")} fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
