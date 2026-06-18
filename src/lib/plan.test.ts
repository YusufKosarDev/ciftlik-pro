import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, isWithinLimit } from "./plan";

describe("plan limitleri", () => {
  it("FREE: 25 hayvan + 3 personel", () => {
    expect(PLAN_LIMITS.FREE.animals).toBe(25);
    expect(PLAN_LIMITS.FREE.users).toBe(3);
  });

  it("PRO sınırsızdır", () => {
    expect(PLAN_LIMITS.PRO.animals).toBe(Infinity);
    expect(PLAN_LIMITS.PRO.users).toBe(Infinity);
  });

  it("isWithinLimit: limitin altında izin verir, limitte/üstünde reddeder", () => {
    expect(isWithinLimit("FREE", "animals", 24)).toBe(true);
    expect(isWithinLimit("FREE", "animals", 25)).toBe(false);
    expect(isWithinLimit("FREE", "animals", 30)).toBe(false);
    expect(isWithinLimit("FREE", "users", 2)).toBe(true);
    expect(isWithinLimit("FREE", "users", 3)).toBe(false);
  });

  it("isWithinLimit: PRO her zaman izin verir", () => {
    expect(isWithinLimit("PRO", "animals", 100000)).toBe(true);
    expect(isWithinLimit("PRO", "users", 9999)).toBe(true);
  });
});
