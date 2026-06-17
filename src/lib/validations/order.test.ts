import { describe, it, expect } from "vitest";
import { orderSchema } from "./order";

const valid = {
  items: [{ productId: "abc123", quantity: 2 }],
  customerName: "Ayşe Yılmaz",
};

describe("orderSchema", () => {
  it("gecerli siparisi kabul eder", () => {
    expect(orderSchema.safeParse(valid).success).toBe(true);
  });

  it("bos sepeti reddeder", () => {
    expect(orderSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
  });

  it("kalemde urun id zorunludur", () => {
    expect(
      orderSchema.safeParse({ ...valid, items: [{ productId: "", quantity: 1 }] }).success
    ).toBe(false);
  });

  it("kalem miktari pozitif olmalidir", () => {
    expect(
      orderSchema.safeParse({ ...valid, items: [{ productId: "x", quantity: 0 }] }).success
    ).toBe(false);
  });

  it("miktari metinden sayiya cevirir", () => {
    const r = orderSchema.safeParse({
      ...valid,
      items: [{ productId: "x", quantity: "3" }],
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.items[0]!.quantity).toBe(3);
  });

  it("ad en az 2 karakter", () => {
    expect(orderSchema.safeParse({ ...valid, customerName: "A" }).success).toBe(false);
  });
});
