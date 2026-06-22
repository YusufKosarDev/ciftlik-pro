"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useFormat } from "@/lib/format";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6366f1", "#14b8a6"];

type Item = { category: string; total: number };

export function FinanceDonutChartImpl({
  incomeData,
  expenseData,
}: {
  incomeData: Item[];
  expenseData: Item[];
}) {
  const { formatMoney } = useFormat();

  const incomePieData = incomeData.map((d) => ({ name: d.category, value: d.total }));
  const expensePieData = expenseData.map((d) => ({ name: d.category, value: d.total }));

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {incomePieData.length > 0 && (
        <div className="h-80 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground text-sm">Gelir Kategori Dağılımı</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={incomePieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {incomePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {expensePieData.length > 0 && (
        <div className="h-80 rounded-xl border border-border bg-card p-5 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground text-sm">Gider Kategori Dağılımı</h3>
          <ResponsiveContainer width="100%" height="85%">
            <PieChart>
              <Pie
                data={expensePieData}
                cx="50%"
                cy="45%"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {expensePieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatMoney(Number(value))} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
