import { describe, it, expect } from "vitest";
import { milkStats, dailyMilkSeries } from "./milk-stats";

const NOW = new Date("2026-05-31T12:00:00");

const yields = [
  { date: new Date("2026-05-31T08:00:00"), amount: 14 },
  { date: new Date("2026-05-30T08:00:00"), amount: 12 },
  { date: new Date("2026-05-29T08:00:00"), amount: 10 },
  { date: new Date("2026-05-20T08:00:00"), amount: 8 }, // 7 gunden eski
];

describe("milkStats", () => {
  it("toplam, sayi ve kayit basina ortalamayi hesaplar", () => {
    const s = milkStats(yields, NOW);
    expect(s.total).toBe(44);
    expect(s.count).toBe(4);
    expect(s.average).toBe(11);
  });

  it("son 7 gun ortalamasini yalnizca pencere icindeki kayitlardan alir", () => {
    const s = milkStats(yields, NOW);
    // 14 + 12 + 10 = 36 / 3 = 12 (8'lik kayit penceredisi)
    expect(s.last7Average).toBe(12);
  });

  it("bos kayitta sifir doner (bolme hatasi yok)", () => {
    const s = milkStats([], NOW);
    expect(s).toEqual({ total: 0, count: 0, average: 0, last7Average: 0 });
  });
});

describe("dailyMilkSeries", () => {
  it("istenen gun sayisi kadar nokta uretir (eskiden yeniye)", () => {
    const series = dailyMilkSeries(yields, 14, NOW);
    expect(series).toHaveLength(14);
    expect(series[series.length - 1].label).toBe("31.05");
    expect(series[0].label).toBe("18.05");
  });

  it("ayni gunun kayitlarini toplar, kayitsiz gunu 0 yapar", () => {
    const sameDay = [
      { date: new Date("2026-05-31T06:00:00"), amount: 5 },
      { date: new Date("2026-05-31T18:00:00"), amount: 7 },
    ];
    const series = dailyMilkSeries(sameDay, 3, NOW);
    expect(series.map((p) => p.amount)).toEqual([0, 0, 12]);
  });
});
