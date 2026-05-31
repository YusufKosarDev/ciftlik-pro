import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { FarmMap } from "@/components/farm-map";
import {
  layoutFields,
  layoutStructures,
  representativeCropStatus,
  type FieldMapInput,
  type StructureMapInput,
} from "@/lib/farm-map";

export default async function HaritaPage() {
  const [fields, structures] = await Promise.all([
    prisma.field.findMany({
      orderBy: { createdAt: "asc" },
      include: { crops: { select: { status: true, plantedDate: true } } },
    }),
    prisma.structure.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const fieldInput: FieldMapInput[] = fields.map((f) => ({
    id: f.id,
    name: f.name,
    area: f.area,
    posX: f.posX,
    posY: f.posY,
    status: representativeCropStatus(f.crops),
  }));
  const rects = layoutFields(fieldInput);

  const structureInput: StructureMapInput[] = structures.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    posX: s.posX,
    posY: s.posY,
    width: s.width,
    height: s.height,
  }));
  const structureRects = layoutStructures(structureInput);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
          <span>🗺️</span> Ciftlik Haritasi
        </h1>
        <p className="text-sm text-gray-500">
          {fields.length} tarla · {structures.length} yapi · kusbakisi 2D yerlesim
          (bir tarlaya tiklayin)
        </p>
      </div>

      {fields.length === 0 && structures.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">
            Henuz tarla eklenmemis. Harita icin once tarla ekleyin.
          </p>
          <Link
            href="/panel/tarlalar/yeni"
            className="mt-3 inline-block text-sm font-medium text-green-600 hover:underline"
          >
            Tarla ekle
          </Link>
        </div>
      ) : (
        <FarmMap fields={rects} structures={structureRects} />
      )}
    </div>
  );
}
