import { describe, it, expect } from "vitest";
import { fieldEconomics } from "./field-economics";

const crops = [
  { cost: 2000, revenue: 5000, yieldAmount: 1200 },
  { cost: 1000, revenue: 1500, yieldAmount: 300 },
  { cost: null, revenue: null, yieldAmount: null }, // bos degerler 0 sayilir
];

describe("fieldEconomics", () => {
  it("toplam gider/gelir/kar ve verimi hesaplar", () => {
    const e = fieldEconomics(crops, 25);
    expect(e.totalCost).toBe(3000);
    expect(e.totalRevenue).toBe(6500);
    expect(e.profit).toBe(3500);
    expect(e.totalYield).toBe(1500);
    expect(e.yieldPerDonum).toBe(60); // 1500 / 25
  });

  it("alan 0 ise donum basina verim null olur", () => {
    const e = fieldEconomics(crops, 0);
    expect(e.yieldPerDonum).toBeNull();
  });

  it("bos ekim listesinde sifirlar doner", () => {
    const e = fieldEconomics([], 10);
    expect(e).toEqual({
      totalCost: 0,
      totalRevenue: 0,
      profit: 0,
      totalYield: 0,
      yieldPerDonum: 0,
    });
  });
});
