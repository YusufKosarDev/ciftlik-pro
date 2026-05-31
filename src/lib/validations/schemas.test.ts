import { describe, it, expect } from "vitest";
import { cropSchema } from "./crop";
import { fieldSchema } from "./field";
import { healthRecordSchema } from "./health";
import { milkYieldSchema } from "./milk";
import { structureSchema } from "./structure";
import { vaccinationSchema } from "./vaccination";

// Daha kucuk semalar icin temel "gecerli kabul / gecersiz red" kapsami.

describe("cropSchema", () => {
  const valid = { name: "Bugday", plantedDate: "2026-03-01", status: "PLANTED" };
  it("gecerli kaydi kabul eder", () => {
    expect(cropSchema.safeParse(valid).success).toBe(true);
  });
  it("bos urun adini reddeder", () => {
    expect(cropSchema.safeParse({ ...valid, name: "  " }).success).toBe(false);
  });
  it("gecersiz ekim tarihini reddeder", () => {
    expect(cropSchema.safeParse({ ...valid, plantedDate: "abc" }).success).toBe(false);
  });
});

describe("fieldSchema", () => {
  const valid = { name: "Dere Tarlasi", area: 25.5 };
  it("gecerli kaydi kabul eder", () => {
    expect(fieldSchema.safeParse(valid).success).toBe(true);
  });
  it("metin alani sayiya cevirir", () => {
    const r = fieldSchema.safeParse({ ...valid, area: "40" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.area).toBe(40);
  });
  it("sifir veya negatif alani reddeder", () => {
    expect(fieldSchema.safeParse({ ...valid, area: 0 }).success).toBe(false);
  });
});

describe("healthRecordSchema", () => {
  const valid = { date: "2026-05-20", diagnosis: "Ayak enfeksiyonu" };
  it("gecerli kaydi kabul eder", () => {
    expect(healthRecordSchema.safeParse(valid).success).toBe(true);
  });
  it("bos teshisi reddeder", () => {
    expect(healthRecordSchema.safeParse({ ...valid, diagnosis: "" }).success).toBe(false);
  });
});

describe("milkYieldSchema", () => {
  const valid = { date: "2026-05-28", amount: 13.5 };
  it("gecerli kaydi kabul eder", () => {
    expect(milkYieldSchema.safeParse(valid).success).toBe(true);
  });
  it("negatif veya cok yuksek miktari reddeder", () => {
    expect(milkYieldSchema.safeParse({ ...valid, amount: -1 }).success).toBe(false);
    expect(milkYieldSchema.safeParse({ ...valid, amount: 5000 }).success).toBe(false);
  });
});

describe("structureSchema", () => {
  const valid = { name: "Buyukbas Ahiri", type: "BARN" };
  it("gecerli kaydi kabul eder", () => {
    expect(structureSchema.safeParse(valid).success).toBe(true);
  });
  it("gecersiz turu reddeder", () => {
    expect(structureSchema.safeParse({ ...valid, type: "GARAGE" }).success).toBe(false);
  });
});

describe("vaccinationSchema", () => {
  const valid = { name: "Sap Asisi", date: "2026-01-10" };
  it("gecerli kaydi kabul eder", () => {
    expect(vaccinationSchema.safeParse(valid).success).toBe(true);
  });
  it("bos asi adini reddeder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });
  it("gecersiz sonraki tarihi reddeder", () => {
    expect(vaccinationSchema.safeParse({ ...valid, nextDate: "abc" }).success).toBe(false);
  });
});
