import { describe, it, expect } from "vitest";
import { productSchema } from "./product";

const valid = { name: "Köy Yumurtası", price: 60, active: "on" };

describe("productSchema", () => {
  it("gecerli urunu kabul eder", () => {
    expect(productSchema.safeParse(valid).success).toBe(true);
  });

  it("kisa adi ve gecersiz fiyati reddeder", () => {
    expect(productSchema.safeParse({ ...valid, name: "X" }).success).toBe(false);
    expect(productSchema.safeParse({ ...valid, price: 0 }).success).toBe(false);
  });

  it("fiyati metinden sayiya cevirir", () => {
    const r = productSchema.safeParse({ ...valid, price: "75" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.price).toBe(75);
  });

  it("active checkbox'unu boolean'a cevirir", () => {
    const on = productSchema.safeParse({ ...valid, active: "on" });
    const off = productSchema.safeParse({ name: "Süt", price: 30, active: undefined });
    expect(on.success && on.data.active).toBe(true);
    expect(off.success && off.data.active).toBe(false);
  });
});
