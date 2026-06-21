"use client";

import { useEffect, useRef, useState } from "react";
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

  // Zoom ve Pan durumları
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Hover Tooltip bilgileri
  const [hoverInfo, setHoverInfo] = useState<{
    kind: "field" | "structure";
    data: FieldRect | StructureRect;
    x: number;
    y: number;
  } | null>(null);

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

  // Zoom wheel event handler'ı passive: false olarak useEffect ile bind ediyoruz (Chrome uyumluluğu için)
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || editing) return;

    const handleWheelRaw = (e: WheelEvent) => {
      e.preventDefault();
      const scaleFactor = 1.15;
      const rect = svg.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setZoom((prevZoom) => {
        const nextZoom = e.deltaY < 0 ? prevZoom * scaleFactor : prevZoom / scaleFactor;
        const clampedZoom = Math.max(0.6, Math.min(4, nextZoom));

        setPan((prevPan) => {
          const dx = mouseX - prevPan.x;
          const dy = mouseY - prevPan.y;
          return {
            x: mouseX - dx * (clampedZoom / prevZoom),
            y: mouseY - dy * (clampedZoom / prevZoom),
          };
        });

        return clampedZoom;
      });
    };

    svg.addEventListener("wheel", handleWheelRaw, { passive: false });
    return () => {
      svg.removeEventListener("wheel", handleWheelRaw);
    };
  }, [editing, zoom]);

  const handleButtonZoom = (zoomIn: boolean) => {
    const scaleFactor = 1.3;
    setZoom((prev) => {
      const nextZoom = zoomIn ? prev * scaleFactor : prev / scaleFactor;
      const clamped = Math.max(0.6, Math.min(4, nextZoom));

      setPan((prevPan) => {
        const centerX = FARM_CANVAS.width / 2;
        const centerY = FARM_CANVAS.height / 2;
        const dx = centerX - prevPan.x;
        const dy = centerY - prevPan.y;
        return {
          x: centerX - dx * (clamped / prev),
          y: centerY - dy * (clamped / prev),
        };
      });

      return clamped;
    });
  };

  const resetZoomPan = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Hover bilgi kartı işleyicileri
  const handleItemPointerEnter = (e: React.PointerEvent, item: FieldRect | StructureRect, kind: "field" | "structure") => {
    if (editing) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverInfo({
        kind,
        data: item,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleItemPointerMove = (e: React.PointerEvent) => {
    if (editing || !hoverInfo) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (rect) {
      setHoverInfo((prev) =>
        prev
          ? {
              ...prev,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            }
          : null
      );
    }
  };

  const handleItemPointerLeave = () => {
    setHoverInfo(null);
  };

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
    // Zoom/pan oranlarına göre <g> içi koordinatı hesapla
    const gX = (p.x - pan.x) / zoom;
    const gY = (p.y - pan.y) / zoom;
    setDrag({ id, kind, offsetX: gX - x, offsetY: gY - y });
    svgRef.current?.setPointerCapture(e.pointerId);
  }

  function onSvgPointerMove(e: React.PointerEvent) {
    if (drag) {
      const p = clientToSvg(e.clientX, e.clientY);
      const gX = (p.x - pan.x) / zoom;
      const gY = (p.y - pan.y) / zoom;
      const rawX = gX - drag.offsetX;
      const rawY = gY - drag.offsetY;

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
    } else if (isPanning && !editing) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }
  }

  function onSvgPointerUp(e: React.PointerEvent) {
    if (drag) {
      svgRef.current?.releasePointerCapture(e.pointerId);
      setDrag(null);
    } else if (isPanning) {
      setIsPanning(false);
      svgRef.current?.releasePointerCapture(e.pointerId);
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
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
                className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                🖉 Yerlesimi duzenle
              </button>
            ) : (
              <>
                <span className="text-xs text-muted-foreground">
                  Surukleyip birakin {movedCount > 0 && `· ${movedCount} degisiklik`}
                </span>
                <button
                  onClick={cancelEdit}
                  disabled={saving}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
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
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div
        className={`relative overflow-hidden rounded-xl border bg-green-50/40 dark:bg-green-500/5 ${
          editing ? "border-green-400 ring-1 ring-green-300" : "border-border"
        }`}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${FARM_CANVAS.width} ${FARM_CANVAS.height}`}
          className={`h-auto w-full touch-none select-none ${editing ? "" : "cursor-grab active:cursor-grabbing"}`}
          role="img"
          aria-label="Ciftlik haritasi"
          onPointerDown={editing ? undefined : (e) => {
            setIsPanning(true);
            setPanStart({ x: e.clientX, y: e.clientY });
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={onSvgPointerMove}
          onPointerUp={onSvgPointerUp}
        >
          {/* Zoom/Pan Transform Grubu */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {renderFields.map((f) => {
              const c = statusColors[f.status];
              return (
                <g
                  key={f.id}
                  style={{ cursor: editing ? "move" : "pointer" }}
                  onPointerDown={(e) => onItemPointerDown(e, f.id, "field", f.x, f.y)}
                  onPointerEnter={(e) => handleItemPointerEnter(e, f, "field")}
                  onPointerMove={handleItemPointerMove}
                  onPointerLeave={handleItemPointerLeave}
                  onClick={() => {
                    if (!editing) router.push(`/panel/tarlalar/${f.id}`);
                  }}
                >
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
                onPointerEnter={(e) => handleItemPointerEnter(e, s, "structure")}
                onPointerMove={handleItemPointerMove}
                onPointerLeave={handleItemPointerLeave}
              >
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
          </g>
        </svg>

        {/* Hover Bilgi Kartı (Tooltip) */}
        {hoverInfo && !editing && (
          <div
            className="absolute z-30 pointer-events-none rounded-lg border border-border bg-card p-3 shadow-lg text-xs space-y-1 w-52 animate-in fade-in zoom-in-95 duration-100"
            style={{
              left: `${hoverInfo.x + 15}px`,
              top: `${hoverInfo.y + 15}px`,
            }}
          >
            {hoverInfo.kind === "field" ? (
              <>
                <p className="font-bold text-sm text-foreground">{hoverInfo.data.name}</p>
                <p className="text-muted-foreground">📍 Konum: {hoverInfo.data.location || "-"}</p>
                <p className="text-muted-foreground">📐 Alan: {hoverInfo.data.area} dönüm</p>
                <p className="text-muted-foreground">
                  🌾 Durum: <span className="font-semibold text-green-600 dark:text-green-400">{statusLabels[hoverInfo.data.status as CropMapStatus]}</span>
                </p>
                {hoverInfo.data.notes && (
                  <p className="border-t border-border mt-1 pt-1 italic text-[10px] text-muted-foreground truncate">
                    {hoverInfo.data.notes}
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="font-bold text-sm text-foreground">
                  {structureIcons[hoverInfo.data.type as StructureType]} {hoverInfo.data.name}
                </p>
                <p className="text-muted-foreground">🏗️ Tür: {structureTypeLabels[hoverInfo.data.type as StructureType]}</p>
                {hoverInfo.data.notes && (
                  <p className="border-t border-border mt-1 pt-1 italic text-[10px] text-muted-foreground truncate">
                    {hoverInfo.data.notes}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Zoom & Pan Buton Kontrolleri */}
        {!editing && (
          <div className="absolute bottom-4 right-4 flex flex-col gap-1.5 z-10">
            <button
              onClick={() => handleButtonZoom(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card font-bold text-foreground shadow-sm hover:bg-muted cursor-pointer transition select-none text-base"
              title="Yakınlaştır"
            >
              ＋
            </button>
            <button
              onClick={() => handleButtonZoom(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card font-bold text-foreground shadow-sm hover:bg-muted cursor-pointer transition select-none text-base"
              title="Uzaklaştır"
            >
              －
            </button>
            <button
              onClick={resetZoomPan}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-xs font-bold text-foreground shadow-sm hover:bg-muted cursor-pointer transition select-none"
              title="Sıfırla"
            >
              ⟲
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
