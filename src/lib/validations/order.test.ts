import { describe, it, expect } from "vitest";
import { orderSchema } from "./order";

const valid = { productId: "abc123", quantity: 2, customerName: "Ayşe Yılmaz" };

describe("orderSchema", () => {
  it("gecerli siparisi kabul eder", () => {
    expect(orderSchema.safeParse(valid).success).toBe(true);
  });

  it("urun id'si zorunludur", () => {
    expect(orderSchema.safeParse({ ...valid, productId: "" }).success).toBe(false);
  });

  it("miktar pozitif olmalidir", () => {
    expect(orderSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
    expect(orderSchema.safeParse({ ...valid, quantity: -1 }).success).toBe(false);
  });

  it("miktari metinden sayiya cevirir", () => {
    const r = orderSchema.safeParse({ ...valid, quantity: "3" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.quantity).toBe(3);
  });

  it("ad en az 2 karakter", () => {
    expect(orderSchema.safeParse({ ...valid, customerName: "A" }).success).toBe(false);
  });
});
