import { describe, it, expect } from "vitest";
import { resolveLocale, isLocale, defaultLocale } from "./resolve-locale";

describe("resolveLocale", () => {
  it("cookie acik secimdir: baslik ne derse desin kazanir", () => {
    expect(resolveLocale("en", "tr-TR,tr;q=0.9")).toBe("en");
    expect(resolveLocale("tr", "en-US,en;q=0.9")).toBe("tr");
  });

  it("cookie yoksa tarayici dilini kullanir", () => {
    expect(resolveLocale(undefined, "en-US,en;q=0.9")).toBe("en");
    expect(resolveLocale(undefined, "tr-TR,tr;q=0.9,en;q=0.8")).toBe("tr");
  });

  it("bolge eki yok sayilir", () => {
    expect(resolveLocale(null, "en-GB")).toBe("en");
    expect(resolveLocale(null, "TR-tr")).toBe("tr");
  });

  it("kalite (q) sirasina uyar, baslikta once gelene degil", () => {
    // Desteklenmeyen diller atlanir; en yuksek q'lu DESTEKLENEN dil secilir.
    expect(resolveLocale(null, "de-DE,de;q=1.0,en;q=0.7,tr;q=0.9")).toBe("tr");
    expect(resolveLocale(null, "fr;q=1.0,en;q=0.9,tr;q=0.4")).toBe("en");
  });

  it("esit kalitede baslikta once gelen kazanir", () => {
    expect(resolveLocale(null, "en,tr")).toBe("en");
    expect(resolveLocale(null, "tr,en")).toBe("tr");
  });

  it("q=0 reddedilmis demektir, secilmez", () => {
    expect(resolveLocale(null, "en;q=0,tr;q=0.5")).toBe("tr");
  });

  it("desteklenmeyen dil, bozuk deger veya baslik yoksa varsayilana duser", () => {
    expect(resolveLocale(undefined, undefined)).toBe(defaultLocale);
    expect(resolveLocale(undefined, "")).toBe(defaultLocale);
    expect(resolveLocale(undefined, "de-DE,fr;q=0.8")).toBe(defaultLocale);
    expect(resolveLocale("de", "de")).toBe(defaultLocale);
    expect(resolveLocale("", "*")).toBe(defaultLocale);
  });

  it("bozuk q degeri gecerli girisin onune gecmez", () => {
    expect(resolveLocale(null, "en;q=abc,tr;q=0.3")).toBe("tr");
  });
});

describe("isLocale", () => {
  it("yalnizca desteklenen kodlari kabul eder", () => {
    expect(isLocale("tr")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
