import type { MonthlyFinance } from "@/components/monthly-finance-chart";

const MONTH_NAMES = [
  "Oca", "Sub", "Mar", "Nis", "May", "Haz",
  "Tem", "Agu", "Eyl", "Eki", "Kas", "Ara",
];

type SimpleTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: Date;
};

// Islemleri son 6 aya gore gruplayip grafik verisi uretir.
export function buildMonthlyFinance(
  transactions: SimpleTransaction[]
): MonthlyFinance[] {
  const now = new Date();
  const buckets: MonthlyFinance[] = [];
  const keyToIndex = new Map<string, number>();

  // Son 6 ayi (en eskiden yeniye) hazirla
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    const label = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
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
