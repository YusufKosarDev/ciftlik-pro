"use client";

import { useRouter } from "next/navigation";
import { FARM_CANVAS, type FieldRect, type CropMapStatus } from "@/lib/farm-map";

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

export function FarmMap({ fields }: { fields: FieldRect[] }) {
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
        </svg>
      </div>
    </div>
  );
}
