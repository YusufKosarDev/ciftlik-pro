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
import type { WeightPoint } from "@/lib/weight-stats";

// Recharts iceren asil grafik; wrapper tarafindan tembel yuklenir.
export function WeightChartImpl({ data }: { data: WeightPoint[] }) {
  return (
    <div className="h-64 w-full rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">Ağırlık Değişimi</h3>
      <ResponsiveContainer width="100%" height="82%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" fontSize={12} />
          <YAxis fontSize={12} unit=" kg" width={52} domain={["auto", "auto"]} />
          <Tooltip formatter={(value) => `${Number(value).toFixed(1)} kg`} />
          <Line
            type="monotone"
            dataKey="weight"
            name="Ağırlık"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
