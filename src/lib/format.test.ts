import { describe, it, expect, vi } from "vitest";

// useFormat, next-intl useLocale'i kullanir; saf bicimlendiricileri izole test
// edebilmek icin locale'i sabitliyoruz.
vi.mock("next-intl", () => ({ useLocale: () => "en" }));

import { formatDate, formatMoney, useFormat } from "./format";

describe("formatDate", () => {
  it("bos deger icin '-' doner", () => {
    expect(formatDate(null)).toBe("-");
    expect(formatDate(undefined)).toBe("-");
  });

  it("tr locale tr-TR bicimi kullanir", () => {
    // 2026-03-09 -> tr-TR: 9.03.2026
    expect(formatDate("2026-03-09", "tr")).toBe(new Date("2026-03-09").toLocaleDateString("tr-TR"));
  });

  it("tr disinda en-US bicimi kullanir", () => {
    expect(formatDate("2026-03-09", "en")).toBe(new Date("2026-03-09").toLocaleDateString("en-US"));
  });

  it("Date nesnesini de kabul eder", () => {
    const d = new Date("2026-01-15");
    expect(formatDate(d, "tr")).toBe(d.toLocaleDateString("tr-TR"));
  });
});

describe("formatMoney", () => {
  it("null/undefined icin '-' doner", () => {
    expect(formatMoney(null)).toBe("-");
    expect(formatMoney(undefined)).toBe("-");
  });

  it("0 degerini '-' yapmaz (sadece null kontrolu)", () => {
    expect(formatMoney(0, "tr")).not.toBe("-");
    expect(formatMoney(0, "tr")).toContain("TL");
  });

  it("tr locale tr-TR bicimi + TL eki kullanir", () => {
    expect(formatMoney(1234.5, "tr")).toBe(
      (1234.5).toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL"
    );
  });

  it("tr disinda en-US bicimi kullanir", () => {
    expect(formatMoney(1234.5, "en")).toBe(
      (1234.5).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " TL"
    );
  });
});

describe("useFormat", () => {
  it("aktif locale'e bagli bicimlendiriciler doner", () => {
    // useLocale mock'u "en" donduruyor.
    const { formatDate: fd, formatMoney: fm } = useFormat();
    expect(fd("2026-03-09")).toBe(new Date("2026-03-09").toLocaleDateString("en-US"));
    expect(fm(1234.5)).toBe(
      (1234.5).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " TL"
    );
    expect(fd(null)).toBe("-");
    expect(fm(null)).toBe("-");
  });
});
