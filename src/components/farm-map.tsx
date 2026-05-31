"use client";

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

export function FarmMap({
  fields,
  structures = [],
}: {
  fields: FieldRect[];
  structures?: StructureRect[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-3">
      {/* Renk aciklamasi (legend) */}
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
        {structures.length > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 rounded"
              style={{ backgroundColor: "#fef3c7", border: "1px solid #d97706" }}
            />
            Yapi
          </span>
        )}
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-green-50/40">
        <svg
          viewBox={`0 0 ${FARM_CANVAS.width} ${FARM_CANVAS.height}`}
          className="h-auto w-full"
          role="img"
          aria-label="Ciftlik haritasi"
        >
          {fields.map((f) => {
            const c = statusColors[f.status];
            return (
              <g
                key={f.id}
                className="cursor-pointer"
                onClick={() => router.push(`/panel/tarlalar/${f.id}`)}
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
                  className="transition-[stroke-width] hover:[stroke-width:4]"
                />
                <text
                  x={f.x + f.side / 2}
                  y={f.y + f.side / 2 - 4}
                  textAnchor="middle"
                  fontSize={18}
                  fontWeight={600}
                  fill={c.text}
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
                >
                  {f.area} donum
                </text>
              </g>
            );
          })}

          {/* Yapilar (ahir/kumes/depo) — goruntuleme amacli */}
          {structures.map((s) => (
            <g key={s.id}>
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
