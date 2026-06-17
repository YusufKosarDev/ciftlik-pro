import { describe, it, expect } from "vitest";
import { filterCommands, type Command } from "./command-filter";

const cmds: Command[] = [
  { id: "1", label: "Hayvanlar", group: "Git", href: "/panel/hayvanlar", keywords: "sayfa" },
  { id: "2", label: "Yeni Hayvan", group: "Oluştur", href: "/panel/hayvanlar/yeni", keywords: "ekle" },
  { id: "3", label: "Finans", group: "Git", href: "/panel/finans" },
];

describe("filterCommands", () => {
  it("bos sorguda tum komutlari doner", () => {
    expect(filterCommands(cmds, "")).toHaveLength(3);
    expect(filterCommands(cmds, "   ")).toHaveLength(3);
  });

  it("etikete gore filtreler (buyuk/kucuk harf duyarsiz)", () => {
    const r = filterCommands(cmds, "HAYVAN");
    expect(r.map((c) => c.id)).toEqual(["1", "2"]);
  });

  it("anahtar kelimeye gore esler", () => {
    expect(filterCommands(cmds, "ekle").map((c) => c.id)).toEqual(["2"]);
  });

  it("eslesme yoksa bos doner", () => {
    expect(filterCommands(cmds, "zzz")).toEqual([]);
  });

  it("buyuk harf duyarsiz (ASCII I -> i)", () => {
    expect(filterCommands(cmds, "fInans").map((c) => c.id)).toEqual(["3"]);
  });
});
