import { describe, it, expect } from "vitest";
import { transactionSchema } from "./transaction";

describe("transactionSchema", () => {
  const valid = {
    type: "INCOME",
    amount: 1500,
    category: "Sut satisi",
    date: "2026-05-30",
  };

  it("gecerli kaydi kabul eder", () => {
    expect(transactionSchema.safeParse(valid).success).toBe(true);
  });

  it("sifir veya negatif tutari reddeder", () => {
    expect(transactionSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(transactionSchema.safeParse({ ...valid, amount: -5 }).success).toBe(false);
  });

  it("metin tutari sayiya cevirir (coerce)", () => {
    const result = transactionSchema.safeParse({ ...valid, amount: "750.5" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(750.5);
  });

  it("gecersiz turu reddeder", () => {
    const result = transactionSchema.safeParse({ ...valid, type: "GELIR" });
    expect(result.success).toBe(false);
  });

  it("bos kategoriyi reddeder", () => {
    const result = transactionSchema.safeParse({ ...valid, category: "  " });
    expect(result.success).toBe(false);
  });
});
