import { describe, it, expect } from "vitest";
import { healthRecordSchema } from "./health";

describe("healthRecordSchema", () => {
  const valid = { date: "2026-05-30", diagnosis: "Mastitis" };

  it("gecerli kaydi kabul eder", () => {
    expect(healthRecordSchema.safeParse(valid).success).toBe(true);
  });

  it("teshis zorunludur", () => {
    expect(healthRecordSchema.safeParse({ ...valid, diagnosis: "" }).success).toBe(false);
  });

  it("cok uzun teshisi reddeder", () => {
    expect(
      healthRecordSchema.safeParse({ ...valid, diagnosis: "a".repeat(201) }).success
    ).toBe(false);
  });

  it("tarih zorunludur", () => {
    expect(healthRecordSchema.safeParse({ ...valid, date: "" }).success).toBe(false);
  });

  it("gecersiz tarihi reddeder", () => {
    expect(healthRecordSchema.safeParse({ ...valid, date: "abc" }).success).toBe(false);
  });

  it("bos opsiyonel tedavi/not alanlarini kabul eder", () => {
    expect(
      healthRecordSchema.safeParse({ ...valid, treatment: "", notes: "" }).success
    ).toBe(true);
  });

  it("cok uzun notu reddeder", () => {
    expect(
      healthRecordSchema.safeParse({ ...valid, notes: "a".repeat(501) }).success
    ).toBe(false);
  });
});
