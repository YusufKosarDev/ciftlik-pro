// Finansal raporlama: kategori bazli kirilim ve CSV uretimi.
// Saf, test edilebilir; veritabanindan bagimsiz.

export type ReportTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  date: Date;
  description?: string | null;
};

export type CategoryTotal = { category: string; total: number };

// Gelir ve gideri kategoriye gore toplar, her birini azalan tutara gore sirar.
export function categoryBreakdown(transactions: ReportTransaction[]): {
  income: CategoryTotal[];
  expense: CategoryTotal[];
} {
  const acc = { INCOME: new Map<string, number>(), EXPENSE: new Map<string, number>() };
  for (const t of transactions) {
    const m = acc[t.type];
    m.set(t.category, (m.get(t.category) ?? 0) + t.amount);
  }
  const toSorted = (m: Map<string, number>): CategoryTotal[] =>
    [...m.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  return { income: toSorted(acc.INCOME), expense: toSorted(acc.EXPENSE) };
}

// Tek bir CSV alanini kacisla (virgul, tirnak veya yeni satir varsa tirnakla).
function csvField(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function isoDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TYPE_LABEL = { INCOME: "Gelir", EXPENSE: "Gider" } as const;

// Islemleri CSV metnine cevirir (basliklarla birlikte).
export function toCsv(transactions: ReportTransaction[]): string {
  const header = ["Tarih", "Tur", "Kategori", "Tutar", "Aciklama"];
  const rows = transactions.map((t) => [
    isoDate(t.date),
    TYPE_LABEL[t.type],
    t.category,
    String(t.amount),
    t.description ?? "",
  ]);
  return [header, ...rows].map((cols) => cols.map(csvField).join(",")).join("\n");
}
