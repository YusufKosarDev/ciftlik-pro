export type DeltaTone = "up" | "down" | "neutral";
export type StatDelta = {
  labelKey: string;
  tone: DeltaTone;
  count?: number;
  amount?: number;
};

// Records added this month (new animals or fields, for instance).
export function countDelta(thisMonth: number): StatDelta {
  if (thisMonth <= 0) return { labelKey: "noNewThisMonth", tone: "neutral" };
  return { labelKey: "newThisMonth", count: thisMonth, tone: "up" };
}

// This month's net amount (income - expense). The sign sets the direction.
export function moneyDelta(net: number): StatDelta {
  if (net === 0) return { labelKey: "zeroThisMonth", tone: "neutral" };
  return { labelKey: "netThisMonth", amount: Math.abs(net), tone: net > 0 ? "up" : "down" };
}

// The overdue task count (a warning; any at all gives it the "down" tone).
export function overdueDelta(count: number): StatDelta {
  if (count <= 0) return { labelKey: "noOverdue", tone: "neutral" };
  return { labelKey: "overdueCount", count, tone: "down" };
}
