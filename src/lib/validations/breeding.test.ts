import { describe, it, expect } from "vitest";
import { breedingSchema } from "./breeding";

describe("breedingSchema", () => {
  const valid = { breedingDate: "2026-03-01", status: "PREGNANT" };

  it("gecerli kaydi kabul eder", () => {
    expect(breedingSchema.safeParse(valid).success).toBe(true);
  });

  it("tohumlama tarihi zorunludur", () => {
    expect(breedingSchema.safeParse({ ...valid, breedingDate: "" }).success).toBe(false);
  });

  it("gecersiz tarihi reddeder", () => {
    expect(breedingSchema.safeParse({ ...valid, breedingDate: "abc" }).success).toBe(false);
  });

  it("bos yavru sayisini undefined yapar (0 degil)", () => {
    const r = breedingSchema.safeParse({ ...valid, offspringCount: "" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.offspringCount).toBeUndefined();
  });

  it("yavru sayisini sayiya cevirir", () => {
    const r = breedingSchema.safeParse({ ...valid, offspringCount: "2" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.offspringCount).toBe(2);
  });

  it("negatif yavru sayisini reddeder", () => {
    expect(breedingSchema.safeParse({ ...valid, offspringCount: "-1" }).success).toBe(false);
  });

  it("gecersiz durumu reddeder", () => {
    expect(breedingSchema.safeParse({ ...valid, status: "OLDU" }).success).toBe(false);
  });

  it("tahmini dogum tohumlamadan once olamaz", () => {
    const r = breedingSchema.safeParse({ ...valid, expectedBirthDate: "2026-02-01" });
    expect(r.success).toBe(false);
  });

  it("gercek dogum tohumlamadan once olamaz", () => {
    const r = breedingSchema.safeParse({ ...valid, actualBirthDate: "2026-02-01" });
    expect(r.success).toBe(false);
  });

  it("tohumlamadan sonraki dogum tarihlerini kabul eder", () => {
    const r = breedingSchema.safeParse({
      ...valid,
      expectedBirthDate: "2026-12-01",
      actualBirthDate: "2026-12-05",
    });
    expect(r.success).toBe(true);
  });
});
