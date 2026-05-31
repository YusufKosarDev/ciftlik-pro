import { describe, it, expect } from "vitest";
import { toDateInputValue } from "./date";

describe("toDateInputValue", () => {
  it("null/undefined icin bos string doner", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue(undefined)).toBe("");
  });

  it("gecersiz tarih icin bos string doner", () => {
    expect(toDateInputValue(new Date("gecersiz"))).toBe("");
  });

  it("gecerli tarihi YYYY-MM-DD formatina cevirir", () => {
    // Yerel saatle oglen; gun kaymasi olmamali.
    const d = new Date(2026, 4, 30, 12, 0, 0); // 30 Mayis 2026
    expect(toDateInputValue(d)).toBe("2026-05-30");
  });

  it("tek haneli ay ve gunu sifirla doldurur", () => {
    const d = new Date(2026, 0, 5, 12, 0, 0); // 5 Ocak 2026
    expect(toDateInputValue(d)).toBe("2026-01-05");
  });
});
