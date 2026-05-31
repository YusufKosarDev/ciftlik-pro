import { describe, it, expect } from "vitest";
import {
  FARM_CANVAS,
  STRUCTURE_DEFAULT,
  areaToSide,
  autoLayoutPosition,
  representativeCropStatus,
  layoutFields,
  layoutStructures,
  type FieldMapInput,
  type StructureMapInput,
} from "./farm-map";

describe("areaToSide", () => {
  it("alan buyudukce kenar buyur", () => {
    expect(areaToSide(100)).toBeGreaterThan(areaToSide(25));
  });

  it("sifir/negatif/gecersiz alanda minimumu doner", () => {
    expect(areaToSide(0)).toBe(60);
    expect(areaToSide(-5)).toBe(60);
    expect(areaToSide(NaN)).toBe(60);
  });

  it("cok buyuk alani maksimuma kelepceler", () => {
    expect(areaToSide(1000000)).toBe(220);
  });
});

describe("autoLayoutPosition", () => {
  it("ilk oge sol uste yakin yerlesir", () => {
    const p = autoLayoutPosition(0, 80);
    expect(p.x).toBeGreaterThanOrEqual(0);
    expect(p.y).toBeGreaterThanOrEqual(0);
  });

  it("sonraki ogeler saga, satir dolunca alta gecer", () => {
    const cols = Math.floor(FARM_CANVAS.width / 240);
    const first = autoLayoutPosition(0, 80);
    const next = autoLayoutPosition(1, 80);
    const wrapped = autoLayoutPosition(cols, 80);
    expect(next.x).toBeGreaterThan(first.x); // saga
    expect(wrapped.y).toBeGreaterThan(first.y); // alta
  });
});

describe("representativeCropStatus", () => {
  it("ekim yoksa NONE doner", () => {
    expect(representativeCropStatus([])).toBe("NONE");
  });

  it("en guncel ekimin durumunu doner", () => {
    const status = representativeCropStatus([
      { status: "HARVESTED", plantedDate: "2025-01-01" },
      { status: "GROWING", plantedDate: "2026-03-01" },
    ]);
    expect(status).toBe("GROWING");
  });
});

describe("layoutFields", () => {
  const base: FieldMapInput = {
    id: "f1",
    name: "Dere",
    area: 25,
    posX: null,
    posY: null,
    status: "NONE",
  };

  it("posX/posY verilmisse o konumu kullanir", () => {
    const [r] = layoutFields([{ ...base, posX: 300, posY: 200 }]);
    expect(r.x).toBe(300);
    expect(r.y).toBe(200);
  });

  it("konum yoksa otomatik yerlestirir (0'dan buyuk)", () => {
    const [r] = layoutFields([base]);
    expect(r.x).toBeGreaterThanOrEqual(0);
    expect(r.y).toBeGreaterThanOrEqual(0);
  });

  it("tuval disindaki konumu iceri kelepceler", () => {
    const [r] = layoutFields([{ ...base, posX: 99999, posY: 99999 }]);
    expect(r.x).toBeLessThanOrEqual(FARM_CANVAS.width - r.side);
    expect(r.y).toBeLessThanOrEqual(FARM_CANVAS.height - r.side);
  });

  it("her tarla icin kenar ve durum tasir", () => {
    const rects = layoutFields([base, { ...base, id: "f2", area: 100 }]);
    expect(rects).toHaveLength(2);
    expect(rects[1].side).toBeGreaterThan(rects[0].side);
  });
});

describe("layoutStructures", () => {
  const base: StructureMapInput = {
    id: "s1",
    name: "Ahir",
    type: "BARN",
    posX: null,
    posY: null,
    width: null,
    height: null,
  };

  it("boyut yoksa varsayilan boyutu kullanir", () => {
    const [r] = layoutStructures([base]);
    expect(r.width).toBe(STRUCTURE_DEFAULT.width);
    expect(r.height).toBe(STRUCTURE_DEFAULT.height);
  });

  it("posX/posY verilmisse o konumu kullanir", () => {
    const [r] = layoutStructures([{ ...base, posX: 100, posY: 50 }]);
    expect(r.x).toBe(100);
    expect(r.y).toBe(50);
  });

  it("tuval disindaki konumu iceri kelepceler", () => {
    const [r] = layoutStructures([{ ...base, posX: 99999, posY: 99999 }]);
    expect(r.x).toBeLessThanOrEqual(FARM_CANVAS.width - r.width);
    expect(r.y).toBeLessThanOrEqual(FARM_CANVAS.height - r.height);
  });

  it("turu ve adi tasir", () => {
    const [r] = layoutStructures([base]);
    expect(r.type).toBe("BARN");
    expect(r.name).toBe("Ahir");
  });
});
