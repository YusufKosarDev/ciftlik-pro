import { describe, it, expect } from "vitest";
import {
  parseMonthParam,
  monthParam,
  monthRange,
  shiftMonth,
  monthGrid,
  groupByDay,
  dayKey,
} from "./calendar";

const NOW = new Date("2026-06-01T12:00:00");

describe("parseMonthParam", () => {
  it("gecerli YYYY-MM cozer", () => {
    expect(parseMonthParam("2026-03", NOW)).toEqual({ year: 2026, month: 2 });
  });
  it("gecersiz/eksik degerde icinde bulunulan ayi doner", () => {
    expect(parseMonthParam(undefined, NOW)).toEqual({ year: 2026, month: 5 });
    expect(parseMonthParam("abc", NOW)).toEqual({ year: 2026, month: 5 });
    expect(parseMonthParam("2026-13", NOW)).toEqual({ year: 2026, month: 5 });
  });
});

describe("monthParam / shiftMonth", () => {
  it("bicimi dogru uretir", () => {
    expect(monthParam(2026, 0)).toBe("2026-01");
  });
  it("ay sinirlarinda yili dogru kaydirir", () => {
    expect(shiftMonth(2026, 0, -1)).toBe("2025-12");
    expect(shiftMonth(2026, 11, 1)).toBe("2027-01");
  });
});

describe("monthRange", () => {
  it("[ayin ilk gunu, sonraki ayin ilk gunu) doner", () => {
    const { start, end } = monthRange(2026, 5);
    expect(start.getTime()).toBe(new Date(2026, 5, 1).getTime());
    expect(end.getTime()).toBe(new Date(2026, 6, 1).getTime());
  });
});

describe("monthGrid", () => {
  it("her zaman 6 hafta x 7 gun = 42 gun uretir", () => {
    const grid = monthGrid(2026, 5, NOW);
    expect(grid).toHaveLength(6);
    expect(grid.every((w) => w.length === 7)).toBe(true);
  });
  it("Pazartesi ile baslar ve ayin ilk gununu dogru konumlar", () => {
    // 1 Haziran 2026 Pazartesi -> ilk hucre dogrudan 01.06 olmali
    const grid = monthGrid(2026, 5, NOW);
    expect(grid[0][0].key).toBe("2026-06-01");
    expect(grid[0][0].inMonth).toBe(true);
  });
  it("bugunu isaretler", () => {
    const grid = monthGrid(2026, 5, NOW);
    const today = grid.flat().find((d) => d.isToday);
    expect(today?.key).toBe("2026-06-01");
  });
  it("onceki ay gunlerini inMonth=false isaretler", () => {
    // Temmuz 2026: 1 Temmuz Carsamba -> grid ilk hucreleri Haziran sonu
    const grid = monthGrid(2026, 6, NOW);
    expect(grid[0][0].inMonth).toBe(false);
  });
});

describe("groupByDay", () => {
  it("olaylari ayni gun anahtarinda toplar", () => {
    const events = [
      { date: new Date("2026-06-05"), kind: "task" as const, label: "A" },
      { date: new Date("2026-06-05"), kind: "harvest" as const, label: "B" },
      { date: new Date("2026-06-10"), kind: "birth" as const, label: "C" },
    ];
    const map = groupByDay(events);
    expect(map.get("2026-06-05")?.length).toBe(2);
    expect(map.get("2026-06-10")?.length).toBe(1);
  });
});

describe("dayKey", () => {
  it("yerel YYYY-MM-DD uretir", () => {
    expect(dayKey(new Date(2026, 5, 9, 23, 0))).toBe("2026-06-09");
  });
});
