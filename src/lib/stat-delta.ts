export type DeltaTone = "up" | "down" | "neutral";
export type StatDelta = {
  labelKey: string;
  tone: DeltaTone;
  count?: number;
  amount?: number;
};

// Bu ay eklenen kayit sayisi (orn. yeni hayvan/tarla).
export function countDelta(thisMonth: number): StatDelta {
  if (thisMonth <= 0) return { labelKey: "noNewThisMonth", tone: "neutral" };
  return { labelKey: "newThisMonth", count: thisMonth, tone: "up" };
}

// Bu ayin net tutari (gelir - gider). Isaret yonu belirler.
export function moneyDelta(net: number): StatDelta {
  if (net === 0) return { labelKey: "zeroThisMonth", tone: "neutral" };
  return { labelKey: "netThisMonth", amount: Math.abs(net), tone: net > 0 ? "up" : "down" };
}

// Geciken gorev sayisi (uyari niteliginde; varsa "down" tonu).
export function overdueDelta(count: number): StatDelta {
  if (count <= 0) return { labelKey: "noOverdue", tone: "neutral" };
  return { labelKey: "overdueCount", count, tone: "down" };
}
