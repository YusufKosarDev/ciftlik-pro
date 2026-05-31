import { describe, it, expect } from "vitest";
import { weightStats, weightSeries } from "./weight-stats";

const records = [
  { date: new Date("2026-05-30"), weightKg: 320 },
  { date: new Date("2026-04-01"), weightKg: 290 }, // ilk
  { date: new Date("2026-05-31"), weightKg: 335 }, // son
];

describe("weightStats", () => {
  it("son, ilk ve degisimi tarihe gore hesaplar (siralamadan bagimsiz)", () => {
    const s = weightStats(records);
    expect(s.first).toBe(290);
    expect(s.latest).toBe(335);
    expect(s.change).toBe(45);
    expect(s.count).toBe(3);
  });

  it("bos kayitta null doner", () => {
    expect(weightStats([])).toEqual({
      count: 0,
      latest: null,
      first: null,
      change: null,
    });
  });

  it("negatif degisimi dogru hesaplar", () => {
    const s = weightStats([
      { date: new Date("2026-01-01"), weightKg: 100 },
      { date: new Date("2026-02-01"), weightKg: 90 },
    ]);
    expect(s.change).toBe(-10);
  });
});

describe("weightSeries", () => {
  it("noktalari eskiden yeniye siralar ve etiketler", () => {
    const series = weightSeries(records);
    expect(series.map((p) => p.weight)).toEqual([290, 320, 335]);
    expect(series[0].label).toBe("01.04");
    expect(series[series.length - 1].label).toBe("31.05");
  });
});
