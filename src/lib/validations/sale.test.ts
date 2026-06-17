import { describe, it, expect } from "vitest";
import { saleSchema } from "./sale";

const valid = { item: "Sut 100L", amount: 1500, date: "2026-06-01" };

describe("saleSchema", () => {
  it("gecerli kaydi kabul eder", () => {
    expect(saleSchema.safeParse(valid).success).toBe(true);
  });

  it("bos urun adini reddeder", () => {
    expect(saleSchema.safeParse({ ...valid, item: "  " }).success).toBe(false);
  });

  it("tutar pozitif olmalidir", () => {
    expect(saleSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
    expect(saleSchema.safeParse({ ...valid, amount: -5 }).success).toBe(false);
  });

  it("tutari metinden sayiya cevirir", () => {
    const r = saleSchema.safeParse({ ...valid, amount: "2500" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.amount).toBe(2500);
  });

  it("miktar opsiyoneldir (bos -> undefined)", () => {
    const r = saleSchema.safeParse({ ...valid, quantity: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.quantity).toBeUndefined();
  });

  it("verilen miktari sayiya cevirir, negatifi reddeder", () => {
    const r = saleSchema.safeParse({ ...valid, quantity: "10" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.quantity).toBe(10);
    expect(saleSchema.safeParse({ ...valid, quantity: "-3" }).success).toBe(false);
  });

  it("gecersiz tarihi reddeder", () => {
    expect(saleSchema.safeParse({ ...valid, date: "abc" }).success).toBe(false);
  });
});
