import { describe, it, expect } from "vitest";
import { animalSchema } from "./animal";

describe("animalSchema", () => {
  it("gecerli veriyi kabul eder", () => {
    const result = animalSchema.safeParse({
      tagNumber: "TR-001",
      species: "CATTLE",
      gender: "FEMALE",
    });
    expect(result.success).toBe(true);
  });

  it("bos kulak numarasini reddeder", () => {
    const result = animalSchema.safeParse({
      tagNumber: "",
      species: "CATTLE",
      gender: "FEMALE",
    });
    expect(result.success).toBe(false);
  });

  it("gecersiz turu reddeder", () => {
    const result = animalSchema.safeParse({
      tagNumber: "TR-001",
      species: "DINOSAUR",
      gender: "FEMALE",
    });
    expect(result.success).toBe(false);
  });

  it("durum verilmezse ACTIVE varsayar", () => {
    const result = animalSchema.safeParse({
      tagNumber: "TR-001",
      species: "GOAT",
      gender: "MALE",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("ACTIVE");
    }
  });

  it("motherId opsiyoneldir (bos gecer, deger kabul edilir)", () => {
    const base = { tagNumber: "TR-009", species: "CATTLE", gender: "FEMALE" } as const;
    expect(animalSchema.safeParse({ ...base }).success).toBe(true);
    expect(animalSchema.safeParse({ ...base, motherId: "" }).success).toBe(true);
    const r = animalSchema.safeParse({ ...base, motherId: "abc123" });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.motherId).toBe("abc123");
  });
});
