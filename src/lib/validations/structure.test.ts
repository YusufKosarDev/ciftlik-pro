import { describe, it, expect } from "vitest";
import { structureSchema } from "./structure";

describe("structureSchema", () => {
  const valid = { name: "1 No'lu Ahir", type: "BARN" };

  it("gecerli kaydi kabul eder", () => {
    expect(structureSchema.safeParse(valid).success).toBe(true);
  });

  it("yapi adi zorunludur", () => {
    expect(structureSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("cok uzun adi reddeder", () => {
    expect(structureSchema.safeParse({ ...valid, name: "a".repeat(81) }).success).toBe(false);
  });

  it("tum gecerli turleri kabul eder", () => {
    for (const type of ["BARN", "COOP", "STORAGE", "OTHER"]) {
      expect(structureSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it("gecersiz turu reddeder", () => {
    expect(structureSchema.safeParse({ ...valid, type: "GARAGE" }).success).toBe(false);
  });

  it("bos opsiyonel notu kabul eder", () => {
    expect(structureSchema.safeParse({ ...valid, notes: "" }).success).toBe(true);
  });
});
