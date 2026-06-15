import { describe, it, expect } from "vitest";
import { vaccinationSchema } from "./vaccination";

describe("vaccinationSchema", () => {
  const valid = { name: "Sap asisi", date: "2026-05-30" };

  it("gecerli kaydi kabul eder", () => {
    expect(vaccinationSchema.safeParse(valid).success).toBe(true);
  });

  it("asi adi zorunludur", () => {
    expect(vaccinationSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("cok uzun asi adini reddeder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, name: "a".repeat(121) }).success).toBe(false);
  });

  it("tarih zorunludur", () => {
    expect(vaccinationSchema.safeParse({ ...valid, date: "" }).success).toBe(false);
  });

  it("gecersiz tarihi reddeder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, date: "abc" }).success).toBe(false);
  });

  it("bos sonraki tarihi kabul eder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, nextDate: "" }).success).toBe(true);
  });

  it("gecerli sonraki tarihi kabul eder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, nextDate: "2026-11-30" }).success).toBe(true);
  });

  it("gecersiz sonraki tarihi reddeder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, nextDate: "abc" }).success).toBe(false);
  });
});
