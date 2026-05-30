import { describe, it, expect } from "vitest";
import { inventorySchema } from "./inventory";

describe("inventorySchema", () => {
  it("gecerli kalemi kabul eder", () => {
    const result = inventorySchema.safeParse({
      name: "Arpa",
      category: "FEED",
      quantity: 500,
      unit: "kg",
      criticalLevel: 100,
    });
    expect(result.success).toBe(true);
  });

  it("negatif miktari reddeder", () => {
    const result = inventorySchema.safeParse({
      name: "Arpa",
      category: "FEED",
      quantity: -5,
      unit: "kg",
    });
    expect(result.success).toBe(false);
  });

  it("metin miktari sayiya cevirir (coerce)", () => {
    const result = inventorySchema.safeParse({
      name: "Arpa",
      category: "FEED",
      quantity: "250",
      unit: "kg",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.quantity).toBe(250);
    }
  });

  it("kritik seviye verilmezse 0 varsayar", () => {
    const result = inventorySchema.safeParse({
      name: "Su",
      category: "OTHER",
      quantity: 10,
      unit: "litre",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.criticalLevel).toBe(0);
    }
  });
});
