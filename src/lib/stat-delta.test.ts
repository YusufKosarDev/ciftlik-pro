import { describe, it, expect } from "vitest";
import { countDelta, moneyDelta, overdueDelta } from "./stat-delta";

describe("countDelta", () => {
  it("pozitif sayiyi 'up' olarak gosterir", () => {
    expect(countDelta(5)).toEqual({ labelKey: "newThisMonth", count: 5, tone: "up" });
  });
  it("sifir/negatifte notr", () => {
    expect(countDelta(0)).toEqual({ labelKey: "noNewThisMonth", tone: "neutral" });
    expect(countDelta(-2)).toEqual({ labelKey: "noNewThisMonth", tone: "neutral" });
  });
});

describe("moneyDelta", () => {
  it("pozitif net -> up, mutlak deger formatlanir", () => {
    expect(moneyDelta(1500)).toEqual({ labelKey: "netThisMonth", amount: 1500, tone: "up" });
  });
  it("negatif net -> down, isaret formatta gozukmez", () => {
    expect(moneyDelta(-800)).toEqual({ labelKey: "netThisMonth", amount: 800, tone: "down" });
  });
  it("sifir -> notr", () => {
    expect(moneyDelta(0)).toEqual({ labelKey: "zeroThisMonth", tone: "neutral" });
  });
});

describe("overdueDelta", () => {
  it("geciken varsa 'down'", () => {
    expect(overdueDelta(3)).toEqual({ labelKey: "overdueCount", count: 3, tone: "down" });
  });
  it("yoksa notr", () => {
    expect(overdueDelta(0)).toEqual({ labelKey: "noOverdue", tone: "neutral" });
  });
});

