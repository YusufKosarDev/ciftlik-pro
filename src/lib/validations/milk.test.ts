import { describe, it, expect } from "vitest";
import { milkYieldSchema } from "./milk";

describe("milkYieldSchema", () => {
  const valid = { date: "2026-05-30", amount: 18.5 };

  it("gecerli kaydi kabul eder", () => {
    expect(milkYieldSchema.safeParse(valid).success).toBe(true);
  });

  it("metin miktari sayiya cevirir", () => {
    const r = milkYieldSchema.safeParse({ ...valid, amount: "12.5" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amount).toBe(12.5);
  });

  it("sifir veya negatif miktari reddeder", () => {
    expect(milkYieldSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(milkYieldSchema.safeParse({ ...valid, amount: -2 }).success).toBe(false);
  });

  it("cok yuksek miktari reddeder", () => {
    expect(milkYieldSchema.safeParse({ ...valid, amount: 1001 }).success).toBe(false);
  });

  it("tarih zorunludur", () => {
    expect(milkYieldSchema.safeParse({ ...valid, date: "" }).success).toBe(false);
  });

  it("gecersiz tarihi reddeder", () => {
    expect(milkYieldSchema.safeParse({ ...valid, date: "abc" }).success).toBe(false);
  });

  it("cok uzun notu reddeder", () => {
    expect(milkYieldSchema.safeParse({ ...valid, notes: "a".repeat(501) }).success).toBe(false);
  });
});
