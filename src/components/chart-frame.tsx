"use client";

import type { ReactNode } from "react";

// The shared shell for every chart, plus the theme-dependent Recharts settings.
//
// WHY: the charts used to use fixed colours (#f0f0f0 for the grid, #16a34a for the
// series). In dark mode the grid was nearly invisible and the axis labels
// unreadable. The colours now come from the --chart-* tokens in globals.css, so
// the charts turn with the theme.
//
// ALSO: the old shell used `<ResponsiveContainer height="82%">` inside an `h-64`
// box. A percentage height did not account for the title and the padding, so
// measurement returned -1 and filled the console with:
//   "The width(-1) and height(-1) of chart should be greater than 0"
// A flex column with `min-h-0 flex-1` gives the chart area the real remaining
// height instead.

export function ChartFrame({
  heightClass,
  title,
  children,
}: {
  heightClass: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <div
      className={`${heightClass} flex w-full flex-col rounded-xl border border-border bg-card p-5`}
    >
      <h3 className="mb-4 shrink-0 font-semibold text-foreground">{title}</h3>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

// The axes (line and labels) are bound to the theme colours.
export const chartAxis = {
  fontSize: 12,
  stroke: "var(--chart-axis)",
  tick: { fill: "var(--chart-axis)" },
} as const;

export const chartGrid = {
  strokeDasharray: "3 3",
  stroke: "var(--chart-grid)",
} as const;

// The tooltip defaults to a white background; in dark mode it uses the card
// surface instead.
export const chartTooltip = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: "0.5rem",
    color: "var(--foreground)",
  },
  labelStyle: { color: "var(--muted-foreground)" },
  itemStyle: { color: "var(--foreground)" },
} as const;

// The categorical palette (donut). The tokens are defined separately for light and
// dark in globals.css.
export const CHART_CATEGORICAL = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const;
