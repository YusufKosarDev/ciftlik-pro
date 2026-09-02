// Data for the monthly income/expense chart. (The chart component takes this type
// from here, so there is no lib -> component back-dependency.)
export type MonthlyFinance = {
  month: string; // Orn. "Ara 2025"
  gelir: number;
  gider: number;
};

// The month label follows the active locale: Intl gives the short month name
// (Oca / Jan), so there is no hard-coded Turkish array to maintain.

type SimpleTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
};

// Groups transactions into the last 6 months and produces the chart data.
export function buildMonthlyFinance(
  transactions: SimpleTransaction[],
  locale: string = "tr"
): MonthlyFinance[] {
  const monthLabel = new Intl.DateTimeFormat(locale === "tr" ? "tr-TR" : "en-US", {
    month: "short",
  });
  const now = new Date();
  const buckets: MonthlyFinance[] = [];
  const keyToIndex = new Map<string, number>();

  // Prepare the last 6 months, oldest first
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${monthLabel.format(d)} ${d.getFullYear()}`;
    keyToIndex.set(key, buckets.length);
    buckets.push({ month: label, gelir: 0, gider: 0 });
  }

  for (const t of transactions) {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const idx = keyToIndex.get(key);
    if (idx === undefined) continue; // 6 ay disindaki islemleri atla
    if (t.type === "INCOME") buckets[idx].gelir += t.amount;
    else buckets[idx].gider += t.amount;
  }

  return buckets;
}
