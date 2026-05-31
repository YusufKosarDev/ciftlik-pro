import type { CropStatus, StructureType } from "@prisma/client";

// 2D ciftlik haritasi icin saf (yan etkisiz) yerlesim/olcekleme yardimcilari.
// UI'dan bagimsizdir; bu sayede kolayca birim testi yazilabilir.

// Haritanin sanal koordinat sistemi (viewBox ile container'a olceklenir).
export const FARM_CANVAS = { width: 1000, height: 700 } as const;

// Tarlanin temsili durumu: ekin durumu ya da hic ekim yoksa "NONE".
export type CropMapStatus = CropStatus | "NONE";

export type FieldMapInput = {
  id: string;
  name: string;
  area: number;
  posX: number | null;
  posY: number | null;
  status: CropMapStatus;
};

export type FieldRect = {
  id: string;
  name: string;
  area: number;
  x: number;
  y: number;
  side: number;
  status: CropMapStatus;
};

// Alan (donum) -> kare kenar uzunlugu (sanal birim).
// Kok olcekli (alan buyudukce kenar daha yavas buyur) ve sinirlandirilmistir.
export function areaToSide(area: number): number {
  const MIN = 60;
  const MAX = 220;
  const SCALE = 14;
  if (!Number.isFinite(area) || area <= 0) return MIN;
  return Math.max(MIN, Math.min(MAX, Math.round(Math.sqrt(area) * SCALE)));
}

// Konumu (posX/posY) olmayan tarlalar icin otomatik izgara yerlesimi.
export function autoLayoutPosition(
  index: number,
  side: number,
  canvas: { width: number; height: number } = FARM_CANVAS
): { x: number; y: number } {
  const CELL = 240;
  const MARGIN = 20;
  const cols = Math.max(1, Math.floor(canvas.width / CELL));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = MARGIN + col * CELL + (CELL - side) / 2;
  const y = MARGIN + row * CELL + (CELL - side) / 2;
  return { x, y };
}

// En guncel ekim kaydina gore tarlanin temsili durumu.
export function representativeCropStatus(
  crops: { status: CropStatus; plantedDate: Date | string }[]
): CropMapStatus {
  if (!crops || crops.length === 0) return "NONE";
  const latest = crops.reduce((a, b) =>
    new Date(a.plantedDate) >= new Date(b.plantedDate) ? a : b
  );
  return latest.status;
}

// Tarlalari haritada konumlandirilmis dikdortgenlere cevirir.
// Konumu olanlar oldugu yerde, olmayanlar otomatik izgaraya yerlesir;
// hepsi tuval sinirlari icine kelepcelenir (clamp).
export function layoutFields(
  fields: FieldMapInput[],
  canvas: { width: number; height: number } = FARM_CANVAS
): FieldRect[] {
  let autoIndex = 0;
  return fields.map((f) => {
    const side = areaToSide(f.area);
    let x: number;
    let y: number;
    if (f.posX != null && f.posY != null) {
      x = f.posX;
      y = f.posY;
    } else {
      const p = autoLayoutPosition(autoIndex++, side, canvas);
      x = p.x;
      y = p.y;
    }
    x = Math.max(0, Math.min(canvas.width - side, x));
    y = Math.max(0, Math.min(canvas.height - side, y));
    return { id: f.id, name: f.name, area: f.area, x, y, side, status: f.status };
  });
}

// --- Yapilar (ahir/kumes/depo) ---

export const STRUCTURE_DEFAULT = { width: 120, height: 90 } as const;

export type StructureMapInput = {
  id: string;
  name: string;
  type: StructureType;
  posX: number | null;
  posY: number | null;
  width: number | null;
  height: number | null;
};

export type StructureRect = {
  id: string;
  name: string;
  type: StructureType;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Konumu olmayan yapilar icin alt seritte (tarlalardan ayrik) otomatik yerlesim.
export function autoLayoutStructurePosition(
  index: number,
  width: number,
  height: number,
  canvas: { width: number; height: number } = FARM_CANVAS
): { x: number; y: number } {
  const GAP = 20;
  const cellW = width + GAP;
  const cols = Math.max(1, Math.floor(canvas.width / cellW));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const x = GAP + col * cellW;
  const y = canvas.height - height - GAP - row * (height + GAP);
  return { x, y };
}

// Yapilari haritada konumlandirilmis dikdortgenlere cevirir.
export function layoutStructures(
  items: StructureMapInput[],
  canvas: { width: number; height: number } = FARM_CANVAS
): StructureRect[] {
  let autoIndex = 0;
  return items.map((s) => {
    const width = s.width && s.width > 0 ? s.width : STRUCTURE_DEFAULT.width;
    const height = s.height && s.height > 0 ? s.height : STRUCTURE_DEFAULT.height;
    let x: number;
    let y: number;
    if (s.posX != null && s.posY != null) {
      x = s.posX;
      y = s.posY;
    } else {
      const p = autoLayoutStructurePosition(autoIndex++, width, height, canvas);
      x = p.x;
      y = p.y;
    }
    x = Math.max(0, Math.min(canvas.width - width, x));
    y = Math.max(0, Math.min(canvas.height - height, y));
    return { id: s.id, name: s.name, type: s.type, x, y, width, height };
  });
}
