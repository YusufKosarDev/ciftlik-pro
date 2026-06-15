import { describe, it, expect } from "vitest";
import { fieldSchema } from "./field";

describe("fieldSchema", () => {
  const valid = { name: "Kuzey Tarla", area: 12.5 };

  it("gecerli kaydi kabul eder", () => {
    expect(fieldSchema.safeParse(valid).success).toBe(true);
  });

  it("tarla adi zorunludur", () => {
    expect(fieldSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("cok uzun tarla adini reddeder", () => {
    expect(fieldSchema.safeParse({ ...valid, name: "a".repeat(81) }).success).toBe(false);
  });

  it("metin alanini sayiya cevirir", () => {
    const r = fieldSchema.safeParse({ ...valid, area: "30" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.area).toBe(30);
  });

  it("sifir veya negatif alani reddeder", () => {
    expect(fieldSchema.safeParse({ ...valid, area: 0 }).success).toBe(false);
    expect(fieldSchema.safeParse({ ...valid, area: -5 }).success).toBe(false);
  });

  it("cok yuksek alani reddeder", () => {
    expect(fieldSchema.safeParse({ ...valid, area: 100001 }).success).toBe(false);
  });

  it("bos opsiyonel konumu kabul eder", () => {
    expect(fieldSchema.safeParse({ ...valid, location: "" }).success).toBe(true);
  });
});
