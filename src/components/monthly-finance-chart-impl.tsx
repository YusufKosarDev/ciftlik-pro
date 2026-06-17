"use client";

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
  return (
    <div className="h-72 w-full rounded-xl border border-gray-200 bg-white p-5">
      <h3 className="mb-4 font-semibold text-gray-900">
        Aylik Gelir - Gider (son 6 ay)
      </h3>
      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip
            formatter={(value) => `${Number(value).toLocaleString("tr-TR")} TL`}
          />
          <Legend />
          <Bar dataKey="gelir" name="Gelir" fill="#16a34a" radius={[4, 4, 0, 0]} />
          <Bar dataKey="gider" name="Gider" fill="#dc2626" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
