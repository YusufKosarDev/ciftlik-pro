// Financial reporting: the per-category breakdown and CSV generation.
// Pure and testable; independent of the database.

export type ReportTransaction = {
  type: "INCOME" | "EXPENSE";
  amount: number;
  category: string;
  date: Date;
  description?: string | null;
};

export type CategoryTotal = { category: string; total: number };

// Totals income and expense by category, each sorted by descending amount.
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

// Makes one CSV field safe.
// 1) Formula injection: Excel and LibreOffice treat a cell beginning with = + - @
//    (or a tab/CR) as a formula. category and description are user input, so they
//    are neutralised with a leading apostrophe. (The amount field cannot be
//    negative after validation, so it never starts with "-" and the numeric
//    columns are left intact.)
// 2) Escaping: a field containing a comma, a quote or a newline is wrapped in
//    quotes.
function csvField(value: string): string {
  let v = value;
  if (/^[=+\-@\t\r]/.test(v)) {
    v = "'" + v;
  }
  if (/[",\n]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`;
  }
  return v;
}

function isoDate(date: Date): string {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const TYPE_LABEL = { INCOME: "Gelir", EXPENSE: "Gider" } as const;

// Turns transactions into CSV text, headers included.
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
