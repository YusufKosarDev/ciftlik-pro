import { describe, it, expect } from "vitest";
import { z } from "zod";
import { requiredDateString, optionalDateString } from "./date";

const required = z.object({ date: requiredDateString() });
const optional = z.object({ date: optionalDateString() });

describe("requiredDateString", () => {
  it("gecerli tarihi kabul eder", () => {
    expect(required.safeParse({ date: "2026-05-30" }).success).toBe(true);
  });

  it("bos tarihi reddeder", () => {
    expect(required.safeParse({ date: "" }).success).toBe(false);
    expect(required.safeParse({ date: "   " }).success).toBe(false);
  });

  it("gecersiz tarih metnini reddeder", () => {
    expect(required.safeParse({ date: "abc" }).success).toBe(false);
    expect(required.safeParse({ date: "2026-13-45" }).success).toBe(false);
  });
});

describe("optionalDateString", () => {
  it("bos birakilabilir", () => {
    expect(optional.safeParse({ date: "" }).success).toBe(true);
    expect(optional.safeParse({}).success).toBe(true);
  });

  it("doluysa gecerli olmalidir", () => {
    expect(optional.safeParse({ date: "2026-05-30" }).success).toBe(true);
    expect(optional.safeParse({ date: "abc" }).success).toBe(false);
  });
});
