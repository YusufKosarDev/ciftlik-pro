import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
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

  // Tarla veya yapi yazma yetkisi olan, yerlesimi surukleyip kaydedebilir.
  const session = await auth();
  const role = session?.user.role;
  const editable = role
    ? canWrite(role, "fields") || canWrite(role, "structures")
    : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>🗺️</span> Ciftlik Haritasi
        </h1>
        <p className="text-sm text-muted-foreground">
          {fields.length} tarla · {structures.length} yapi · kusbakisi 2D yerlesim
          (bir tarlaya tiklayin)
        </p>
      </div>

      {fields.length === 0 && structures.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-muted-foreground">
            Henuz tarla eklenmemis. Harita icin once tarla ekleyin.
          </p>
          <Link
            href="/panel/tarlalar/yeni"
            className="mt-3 inline-block text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            Tarla ekle
          </Link>
        </div>
      ) : (
        <FarmMap fields={rects} structures={structureRects} editable={editable} />
      )}
    </div>
  );
}
