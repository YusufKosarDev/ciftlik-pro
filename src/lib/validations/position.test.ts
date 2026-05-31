import { describe, it, expect } from "vitest";
import { positionSchema } from "./position";

describe("positionSchema", () => {
  it("gecerli sayisal konumu kabul eder", () => {
    const result = positionSchema.safeParse({ posX: 120, posY: 340 });
    expect(result.success).toBe(true);
  });

  it("metin konumu sayiya cevirir (coerce)", () => {
    const result = positionSchema.safeParse({ posX: "120", posY: "340" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.posX).toBe(120);
      expect(result.data.posY).toBe(340);
    }
  });

  it("eksik alani reddeder", () => {
    expect(positionSchema.safeParse({ posX: 10 }).success).toBe(false);
  });

  it("sayi olmayani reddeder", () => {
    expect(positionSchema.safeParse({ posX: "abc", posY: 5 }).success).toBe(false);
  });
});
