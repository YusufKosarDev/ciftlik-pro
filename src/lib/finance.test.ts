import { describe, it, expect } from "vitest";
import { buildMonthlyFinance } from "./finance";

describe("buildMonthlyFinance", () => {
  it("her zaman 6 ay dondurur", () => {
    const result = buildMonthlyFinance([]);
    expect(result).toHaveLength(6);
  });

  it("ay etiketi aktif dile gore uretilir", () => {
    const tr = buildMonthlyFinance([], "tr").map((m) => m.month);
    const en = buildMonthlyFinance([], "en").map((m) => m.month);
    // Etiket "<kisa ay> <yil>" bicimindedir ve dile gore FARKLI olmalidir
    // (grafik ekseninde Ingilizce arayuzde Turkce ay adi gorunmesin).
    expect(tr).toHaveLength(6);
    expect(en).toHaveLength(6);
    expect(tr.every((label) => /^\S+ \d{4}$/.test(label))).toBe(true);
    expect(en.every((label) => /^\S+ \d{4}$/.test(label))).toBe(true);
    // Yil ayni, ay adi dile bagli: en az bir ayda ayrisirlar.
    expect(tr.some((label, i) => label !== en[i])).toBe(true);
  });

  it("bos veride tum aylar sifirdir", () => {
    const result = buildMonthlyFinance([]);
    for (const month of result) {
      expect(month.gelir).toBe(0);
      expect(month.gider).toBe(0);
    }
  });

  it("bu ayin gelir ve giderini dogru gruplar", () => {
    const now = new Date();
    const result = buildMonthlyFinance([
      { type: "INCOME", amount: 1000, date: now },
      { type: "INCOME", amount: 500, date: now },
      { type: "EXPENSE", amount: 300, date: now },
    ]);
    // Son eleman icinde bulunulan ay
    const current = result[result.length - 1];
    expect(current.gelir).toBe(1500);
    expect(current.gider).toBe(300);
  });

  it("6 aydan eski islemleri haric tutar", () => {
    const old = new Date();
    old.setMonth(old.getMonth() - 10);
    const result = buildMonthlyFinance([
      { type: "INCOME", amount: 9999, date: old },
    ]);
    const totalGelir = result.reduce((s, m) => s + m.gelir, 0);
    expect(totalGelir).toBe(0);
  });
});
