"use client";

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

// Recharts iceren asil grafik; wrapper tarafindan tembel yuklenir.
export function MilkYieldChartImpl({ data }: { data: MilkDailyPoint[] }) {
  return (
    <div className="h-64 w-full rounded-xl border border-border bg-card p-5">
      <h3 className="mb-4 font-semibold text-foreground">
        Günlük Süt Verimi (son {data.length} gün)
      </h3>
      <ResponsiveContainer width="100%" height="82%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" fontSize={12} />
          <YAxis fontSize={12} unit=" L" width={48} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)} L`} />
          <Line
            type="monotone"
            dataKey="amount"
            name="Litre"
            stroke="#16a34a"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
