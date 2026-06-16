import { describe, it, expect } from "vitest";
import { parseListParams } from "./list-query";

const opts = {
  sortableKeys: ["name", "createdAt"] as const,
  defaultSort: "createdAt",
} as const;

describe("parseListParams", () => {
  it("varsayilanlari uygular (bos params)", () => {
    const r = parseListParams({}, opts);
    expect(r).toEqual({ page: 1, q: "", sort: "createdAt", dir: "desc", skip: 0, take: 10 });
  });

  it("gecerli sayfayi skip'e cevirir", () => {
    const r = parseListParams({ page: "3" }, opts);
    expect(r.page).toBe(3);
    expect(r.skip).toBe(20); // (3-1)*10
    expect(r.take).toBe(10);
  });

  it("gecersiz/negatif sayfayi 1'e dusurur", () => {
    expect(parseListParams({ page: "abc" }, opts).page).toBe(1);
    expect(parseListParams({ page: "0" }, opts).page).toBe(1);
    expect(parseListParams({ page: "-2" }, opts).page).toBe(1);
  });

  it("arama metnini trim'ler", () => {
    expect(parseListParams({ q: "  inek  " }, opts).q).toBe("inek");
  });

  it("yalnizca izin verilen sort anahtarini kabul eder", () => {
    expect(parseListParams({ sort: "name" }, opts).sort).toBe("name");
    // Izin disi -> default
    expect(parseListParams({ sort: "password" }, opts).sort).toBe("createdAt");
  });

  it("dir'i dogrular (asc/desc disi -> default)", () => {
    expect(parseListParams({ dir: "asc" }, opts).dir).toBe("asc");
    expect(parseListParams({ dir: "xyz" }, opts).dir).toBe("desc");
    expect(parseListParams({ dir: "asc" }, { ...opts, defaultDir: "asc" }).dir).toBe("asc");
  });

  it("ozel pageSize'i kullanir", () => {
    const r = parseListParams({ page: "2" }, { ...opts, pageSize: 25 });
    expect(r.take).toBe(25);
    expect(r.skip).toBe(25);
  });

  it("dizi degerinde ilk elemani alir", () => {
    expect(parseListParams({ q: ["a", "b"] }, opts).q).toBe("a");
  });
});
