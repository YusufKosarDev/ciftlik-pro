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

  describe("imageUrl", () => {
    const base = { tagNumber: "TR-010", species: "CATTLE", gender: "FEMALE" } as const;

    it("http ve https gorsel URL'lerini kabul eder", () => {
      expect(animalSchema.safeParse({ ...base, imageUrl: "https://ornek.com/inek.jpg" }).success).toBe(true);
      expect(animalSchema.safeParse({ ...base, imageUrl: "http://ornek.com/inek.jpg" }).success).toBe(true);
    });

    it("bos veya verilmemis gorseli kabul eder", () => {
      expect(animalSchema.safeParse({ ...base }).success).toBe(true);
      expect(animalSchema.safeParse({ ...base, imageUrl: "" }).success).toBe(true);
    });

    it("javascript:, data: ve diger semalari reddeder", () => {
      expect(animalSchema.safeParse({ ...base, imageUrl: "javascript:alert(1)" }).success).toBe(false);
      expect(animalSchema.safeParse({ ...base, imageUrl: "data:image/png;base64,AAAA" }).success).toBe(false);
      expect(animalSchema.safeParse({ ...base, imageUrl: "file:///etc/passwd" }).success).toBe(false);
    });

    it("URL olmayan metni reddeder", () => {
      expect(animalSchema.safeParse({ ...base, imageUrl: "sadece-metin" }).success).toBe(false);
    });
  });
});
