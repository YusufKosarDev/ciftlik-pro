import { describe, it, expect } from "vitest";
import { customerSchema } from "./customer";

describe("customerSchema", () => {
  it("gecerli kaydi kabul eder (sadece ad)", () => {
    expect(customerSchema.safeParse({ name: "Ahmet Süt" }).success).toBe(true);
  });

  it("cok kisa adi reddeder", () => {
    expect(customerSchema.safeParse({ name: "A" }).success).toBe(false);
  });

  it("bos e-postayi kabul eder, gecersizi reddeder", () => {
    expect(customerSchema.safeParse({ name: "Mehmet", email: "" }).success).toBe(true);
    expect(customerSchema.safeParse({ name: "Mehmet", email: "abc" }).success).toBe(false);
    expect(customerSchema.safeParse({ name: "Mehmet", email: "a@b.com" }).success).toBe(true);
  });

  it("telefon ve not opsiyoneldir", () => {
    const r = customerSchema.safeParse({ name: "Veli", phone: "0555", notes: "" });
    expect(r.success).toBe(true);
  });
});
