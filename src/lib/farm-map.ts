import type { CropStatus, StructureType } from "@prisma/client";

// Pure (side-effect free) layout and scaling helpers for the 2D farm map.
// Independent of the UI, which is what makes them easy to unit test.

// The map's virtual coordinate system (scaled to the container via viewBox).
export const FARM_CANVAS = { width: 1000, height: 700 } as const;

// A field's representative status: the crop's status, or "NONE" when unplanted.
export type CropMapStatus = CropStatus | "NONE";

export type FieldMapInput = {
  id: string;
  name: string;
  area: number;
  location: string | null;
  notes: string | null;
  posX: number | null;
  posY: number | null;
  status: CropMapStatus;
};

export type FieldRect = {
  id: string;
  name: string;
  area: number;
  location: string | null;
  notes: string | null;
  x: number;
  y: number;
  side: number;
  status: CropMapStatus;
};

// Area (decares) -> square side length (virtual units).
// Square-root scaled — the side grows more slowly as the area grows — and clamped.
export function areaToSide(area: number): number {
  const MIN = 60;
  const MAX = 220;
  const SCALE = 14;
  if (!Number.isFinite(area) || area <= 0) return MIN;
  return Math.max(MIN, Math.min(MAX, Math.round(Math.sqrt(area) * SCALE)));
}

// Automatic grid placement for fields with no position (posX/posY).
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

// The field's representative status, taken from its most recent crop record.
export function representativeCropStatus(
  crops: { status: CropStatus; plantedDate: Date | string }[]
): CropMapStatus {
  if (!crops || crops.length === 0) return "NONE";
  const latest = crops.reduce((a, b) =>
    new Date(a.plantedDate) >= new Date(b.plantedDate) ? a : b
  );
  return latest.status;
}

// Turns fields into positioned rectangles on the map.
// Those with a position stay where they are, those without fall into the automatic
// grid; all of them are clamped inside the canvas bounds.
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
    return { id: f.id, name: f.name, area: f.area, location: f.location, notes: f.notes, x, y, side, status: f.status };
  });
}

// --- Structures (barn/coop/store) ---

export const STRUCTURE_DEFAULT = { width: 120, height: 90 } as const;

export type StructureMapInput = {
  id: string;
  name: string;
  type: StructureType;
  notes: string | null;
  posX: number | null;
  posY: number | null;
  width: number | null;
  height: number | null;
};

export type StructureRect = {
  id: string;
  name: string;
  type: StructureType;
  notes: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
};

// Automatic placement for structures with no position, in a lower band kept
// separate from the fields.
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

// Turns structures into positioned rectangles on the map.
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
    return { id: s.id, name: s.name, type: s.type, notes: s.notes, x, y, width, height };
  });
}
