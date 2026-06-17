import { describe, it, expect } from "vitest";
import { countDelta, moneyDelta, overdueDelta } from "./stat-delta";

const fmt = (n: number) => `₺${n}`;

describe("countDelta", () => {
  it("pozitif sayiyi 'up' olarak gosterir", () => {
    expect(countDelta(5)).toEqual({ label: "+5 bu ay", tone: "up" });
  });
  it("sifir/negatifte notr", () => {
    expect(countDelta(0)).toEqual({ label: "bu ay yeni yok", tone: "neutral" });
    expect(countDelta(-2).tone).toBe("neutral");
  });
});

describe("moneyDelta", () => {
  it("pozitif net -> up, mutlak deger formatlanir", () => {
    expect(moneyDelta(1500, fmt)).toEqual({ label: "₺1500 bu ay", tone: "up" });
  });
  it("negatif net -> down, isaret formatta gozukmez", () => {
    expect(moneyDelta(-800, fmt)).toEqual({ label: "₺800 bu ay", tone: "down" });
  });
  it("sifir -> notr", () => {
    expect(moneyDelta(0, fmt).tone).toBe("neutral");
  });
});

describe("overdueDelta", () => {
  it("geciken varsa 'down'", () => {
    expect(overdueDelta(3)).toEqual({ label: "3 geciken", tone: "down" });
  });
  it("yoksa notr", () => {
    expect(overdueDelta(0)).toEqual({ label: "geciken yok", tone: "neutral" });
  });
});
