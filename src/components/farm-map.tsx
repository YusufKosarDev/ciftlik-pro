"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FARM_CANVAS,
  type FieldRect,
  type StructureRect,
  type CropMapStatus,
} from "@/lib/farm-map";
import { structureTypeLabels } from "@/lib/labels";
import type { StructureType } from "@prisma/client";

// Ekin durumuna gore tarla renkleri.
const statusColors: Record<CropMapStatus, { fill: string; stroke: string; text: string }> = {
  PLANTED: { fill: "#dbeafe", stroke: "#3b82f6", text: "#1e3a8a" }, // mavi
  GROWING: { fill: "#dcfce7", stroke: "#22c55e", text: "#166534" }, // yesil
  HARVESTED: { fill: "#f3f4f6", stroke: "#9ca3af", text: "#374151" }, // gri
  NONE: { fill: "#fefce8", stroke: "#d1d5db", text: "#6b7280" }, // notr
};

const statusLabels: Record<CropMapStatus, string> = {
  PLANTED: "Ekildi",
  GROWING: "Buyuyor",
  HARVESTED: "Hasat edildi",
  NONE: "Ekim yok",
};

// Yapi turune gore ikon (haritada gosterilir).
const structureIcons: Record<StructureType, string> = {
  BARN: "🐄",
  COOP: "🐔",
  STORAGE: "📦",
  OTHER: "🏠",
};

const GRID = 10; // Konumlar bu izgaraya yapisir.

type Drag = {
  id: string;
  kind: "field" | "structure";
  offsetX: number;
  offsetY: number;
};

function snap(v: number): number {
  return Math.round(v / GRID) * GRID;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function FarmMap({
  fields,
  structures = [],
  editable = false,
}: {
  fields: FieldRect[];
  structures?: StructureRect[];
  editable?: boolean;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);

  // Duzenleme modunda draft* dolu; degilken null ve dogrudan prop'lardan render edilir.
  const [draftFields, setDraftFields] = useState<FieldRect[] | null>(null);
  const [draftStructs, setDraftStructs] = useState<StructureRect[] | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [moved, setMoved] = useState<{ fields: Set<string>; structures: Set<string> }>({
    fields: new Set(),
    structures: new Set(),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const editing = draftFields !== null;
  const renderFields = draftFields ?? fields;
  const renderStructs = draftStructs ?? structures;

  function clientToSvg(clientX: number, clientY: number) {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return { x: 0, y: 0 };
    const p = pt.matrixTransform(ctm.inverse());
    return { x: p.x, y: p.y };
  }

  function onItemPointerDown(
    e: React.PointerEvent,
    id: string,
    kind: "field" | "structure",
    x: number,
    y: number
  ) {
    if (!editing) return;
    e.stopPropagation();
    const p = clientToSvg(e.clientX, e.clientY);
    setDrag({ id, kind, offsetX: p.x - x, offsetY: p.y - y });
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function onSvgPointerMove(e: React.PointerEvent) {
    if (!drag) return;
    const p = clientToSvg(e.clientX, e.clientY);
    const rawX = p.x - drag.offsetX;
    const rawY = p.y - drag.offsetY;

    if (drag.kind === "field") {
      setDraftFields((prev) =>
        (prev ?? fields).map((f) =>
          f.id === drag.id
            ? {
                ...f,
                x: snap(clamp(rawX, 0, FARM_CANVAS.width - f.side)),
                y: snap(clamp(rawY, 0, FARM_CANVAS.height - f.side)),
              }
            : f
        )
      );
    } else {
      setDraftStructs((prev) =>
        (prev ?? structures).map((s) =>
          s.id === drag.id
            ? {
                ...s,
                x: snap(clamp(rawX, 0, FARM_CANVAS.width - s.width)),
                y: snap(clamp(rawY, 0, FARM_CANVAS.height - s.height)),
              }
            : s
        )
      );
    }

    setMoved((m) => {
      const next = { fields: new Set(m.fields), structures: new Set(m.structures) };
      next[drag.kind === "field" ? "fields" : "structures"].add(drag.id);
      return next;
    });
  }

  function onSvgPointerUp(e: React.PointerEvent) {
    if (drag) {
      svgRef.current?.releasePointerCapture(e.pointerId);
      setDrag(null);
    }
  }

  function startEdit() {
    setError(null);
    setMoved({ fields: new Set(), structures: new Set() });
    setDraftFields(fields.map((f) => ({ ...f })));
    setDraftStructs(structures.map((s) => ({ ...s })));
  }

  function cancelEdit() {
    setDraftFields(null);
    setDraftStructs(null);
    setMoved({ fields: new Set(), structures: new Set() });
    setError(null);
  }

  async function saveLayout() {
    setSaving(true);
    setError(null);
    try {
      const reqs: Promise<Response>[] = [];
      for (const f of renderFields) {
        if (moved.fields.has(f.id)) {
          reqs.push(
            fetch(`/api/fields/${f.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ posX: f.x, posY: f.y }),
            })
          );
        }
      }
      for (const s of renderStructs) {
        if (moved.structures.has(s.id)) {
          reqs.push(
            fetch(`/api/structures/${s.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ posX: s.x, posY: s.y }),
            })
          );
        }
      }

      const results = await Promise.all(reqs);
      if (results.some((r) => !r.ok)) {
        setError("Bazi konumlar kaydedilemedi. Yetkiniz olmayabilir.");
        setSaving(false);
        return;
      }

      setSaving(false);
      setDraftFields(null);
      setDraftStructs(null);
      setMoved({ fields: new Set(), structures: new Set() });
      router.refresh();
    } catch {
      setError("Kayit sirasinda hata olustu.");
      setSaving(false);
    }
  }

  const movedCount = moved.fields.size + moved.structures.size;

  return (
    <div className="space-y-3">
      {/* Arac cubugu + renk aciklamasi */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3 text-xs text-gray-600">
          {(Object.keys(statusLabels) as CropMapStatus[]).map((s) => (
            <span key={s} className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ backgroundColor: statusColors[s].fill, border: `1px solid ${statusColors[s].stroke}` }}
              />
              {statusLabels[s]}
            </span>
          ))}
          {renderStructs.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span
                className="inline-block h-3 w-3 rounded"
                style={{ backgroundColor: "#fef3c7", border: "1px solid #d97706" }}
              />
              Yapi
            </span>
          )}
        </div>

        {editable && (
          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={startEdit}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                🖉 Yerlesimi duzenle
              </button>
            ) : (
              <>
                <span className="text-xs text-gray-500">
                  Surukleyip birakin {movedCount > 0 && `· ${movedCount} degisiklik`}
                </span>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-60"
                >
                  Iptal
                </button>
                <button
                  onClick={saveLayout}
                  disabled={saving || movedCount === 0}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60"
                >
                  {saving ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div
        className={`overflow-hidden rounded-xl border bg-green-50/40 ${
          editing ? "border-green-400 ring-1 ring-green-300" : "border-gray-200"
        }`}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${FARM_CANVAS.width} ${FARM_CANVAS.height}`}
          className="h-auto w-full touch-none"
          role="img"
          aria-label="Ciftlik haritasi"
          onPointerMove={editing ? onSvgPointerMove : undefined}
          onPointerUp={editing ? onSvgPointerUp : undefined}
        >
          {renderFields.map((f) => {
            const c = statusColors[f.status];
            return (
              <g
                key={f.id}
                style={{ cursor: editing ? "move" : "pointer" }}
                onPointerDown={(e) => onItemPointerDown(e, f.id, "field", f.x, f.y)}
                onClick={() => {
                  if (!editing) router.push(`/panel/tarlalar/${f.id}`);
                }}
              >
                <title>{`${f.name} — ${f.area} donum`}</title>
                <rect
                  x={f.x}
                  y={f.y}
                  width={f.side}
                  height={f.side}
                  rx={10}
                  fill={c.fill}
                  stroke={c.stroke}
                  strokeWidth={2}
                />
                <text
                  x={f.x + f.side / 2}
                  y={f.y + f.side / 2 - 4}
                  textAnchor="middle"
                  fontSize={18}
                  fontWeight={600}
                  fill={c.text}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {f.name}
                </text>
                <text
                  x={f.x + f.side / 2}
                  y={f.y + f.side / 2 + 16}
                  textAnchor="middle"
                  fontSize={13}
                  fill={c.text}
                  opacity={0.8}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {f.area} donum
                </text>
              </g>
            );
          })}

          {/* Yapilar (ahir/kumes/depo) */}
          {renderStructs.map((s) => (
            <g
              key={s.id}
              style={{ cursor: editing ? "move" : "default" }}
              onPointerDown={(e) => onItemPointerDown(e, s.id, "structure", s.x, s.y)}
            >
              <title>{`${s.name} — ${structureTypeLabels[s.type]}`}</title>
              <rect
                x={s.x}
                y={s.y}
                width={s.width}
                height={s.height}
                rx={8}
                fill="#fef3c7"
                stroke="#d97706"
                strokeWidth={2}
              />
              <text
                x={s.x + s.width / 2}
                y={s.y + s.height / 2 - 6}
                textAnchor="middle"
                fontSize={26}
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {structureIcons[s.type]}
              </text>
              <text
                x={s.x + s.width / 2}
                y={s.y + s.height / 2 + 18}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="#92400e"
                style={{ pointerEvents: "none", userSelect: "none" }}
              >
                {s.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
