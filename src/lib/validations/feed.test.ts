import { describe, it, expect } from "vitest";
import { feedSchema } from "./feed";

describe("feedSchema", () => {
  const valid = { inventoryItemId: "abc123", date: "2026-05-30", quantity: 25 };

  it("gecerli kaydi kabul eder", () => {
    expect(feedSchema.safeParse(valid).success).toBe(true);
  });

  it("yem kalemi zorunludur", () => {
    expect(feedSchema.safeParse({ ...valid, inventoryItemId: "" }).success).toBe(false);
  });

  it("metin miktari sayiya cevirir", () => {
    const r = feedSchema.safeParse({ ...valid, quantity: "12.5" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.quantity).toBe(12.5);
  });

  it("sifir veya negatif miktari reddeder", () => {
    expect(feedSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
    expect(feedSchema.safeParse({ ...valid, quantity: -3 }).success).toBe(false);
  });

  it("gecersiz tarihi reddeder", () => {
    expect(feedSchema.safeParse({ ...valid, date: "abc" }).success).toBe(false);
  });
});
