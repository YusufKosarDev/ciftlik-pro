import { describe, it, expect } from "vitest";
import { categoryBreakdown, toCsv } from "./finance-report";

const txs = [
  { type: "INCOME" as const, amount: 5000, category: "Sut satisi", date: new Date("2026-05-20") },
  { type: "INCOME" as const, amount: 3500, category: "Sut satisi", date: new Date("2026-04-15") },
  { type: "INCOME" as const, amount: 4200, category: "Hayvan satisi", date: new Date("2026-03-01") },
  { type: "EXPENSE" as const, amount: 2000, category: "Yem alimi", date: new Date("2026-05-22") },
  { type: "EXPENSE" as const, amount: 1200, category: "Ilac alimi", date: new Date("2026-04-18") },
];

describe("categoryBreakdown", () => {
  it("kategoriye gore toplar ve azalan sirar", () => {
    const b = categoryBreakdown(txs);
    expect(b.income).toEqual([
      { category: "Sut satisi", total: 8500 },
      { category: "Hayvan satisi", total: 4200 },
    ]);
    expect(b.expense[0]).toEqual({ category: "Yem alimi", total: 2000 });
  });

  it("bos listede bos kirilim doner", () => {
    expect(categoryBreakdown([])).toEqual({ income: [], expense: [] });
  });
});

describe("toCsv", () => {
  it("baslik + satir uretir, tur etiketler", () => {
    const csv = toCsv([txs[0]]);
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Tarih,Tur,Kategori,Tutar,Aciklama");
    expect(lines[1]).toBe("2026-05-20,Gelir,Sut satisi,5000,");
  });

  it("virgul/tirnak iceren alani kacisla sarar", () => {
    const csv = toCsv([
      { type: "EXPENSE", amount: 10, category: "Yem, premium", date: new Date("2026-01-01"), description: 'a"b' },
    ]);
    const line = csv.split("\n")[1];
    expect(line).toContain('"Yem, premium"');
    expect(line).toContain('"a""b"');
  });

  it("formul enjeksiyonunu notrlestirir (= + - @ ile baslayan alanlar)", () => {
    const csv = toCsv([
      {
        type: "INCOME",
        amount: 10,
        category: "=SUM(A1:A2)",
        date: new Date("2026-01-01"),
        description: "@cmd",
      },
    ]);
    const line = csv.split("\n")[1];
    // Tehlikeli alanlarin basina tek tirnak eklenir.
    expect(line).toContain("'=SUM(A1:A2)");
    expect(line).toContain("'@cmd");
  });

  it("negatif olmayan tutar sutununu bozmaz", () => {
    const csv = toCsv([
      { type: "EXPENSE", amount: 2000, category: "Yem", date: new Date("2026-01-01") },
    ]);
    expect(csv.split("\n")[1]).toBe("2026-01-01,Gider,Yem,2000,");
  });
});
