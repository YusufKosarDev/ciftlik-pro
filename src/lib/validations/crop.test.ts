import { describe, it, expect } from "vitest";
import { cropSchema } from "./crop";

describe("cropSchema", () => {
  const valid = { name: "Bugday", plantedDate: "2026-03-01", status: "PLANTED" };

  it("gecerli kaydi kabul eder", () => {
    expect(cropSchema.safeParse(valid).success).toBe(true);
  });

  it("urun adi zorunludur", () => {
    expect(cropSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("ekim tarihi zorunludur", () => {
    expect(cropSchema.safeParse({ ...valid, plantedDate: "" }).success).toBe(false);
  });

  it("bos ekonomik alanlari undefined yapar", () => {
    const r = cropSchema.safeParse({ ...valid, cost: "", revenue: "", yieldAmount: "" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.cost).toBeUndefined();
      expect(r.data.revenue).toBeUndefined();
    }
  });

  it("negatif gideri reddeder", () => {
    expect(cropSchema.safeParse({ ...valid, cost: "-5" }).success).toBe(false);
  });

  it("hasat tarihi ekimden once olamaz", () => {
    const r = cropSchema.safeParse({ ...valid, harvestDate: "2026-02-01" });
    expect(r.success).toBe(false);
  });

  it("ekimden sonraki hasat tarihini kabul eder", () => {
    const r = cropSchema.safeParse({ ...valid, harvestDate: "2026-08-01" });
    expect(r.success).toBe(true);
  });

  it("ayni gun hasadi kabul eder", () => {
    const r = cropSchema.safeParse({ ...valid, harvestDate: "2026-03-01" });
    expect(r.success).toBe(true);
  });
});
