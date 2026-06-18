import Link from "next/link";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { CropForm } from "@/components/crop-form";
import { requirePageWrite } from "@/lib/authz";

export default async function EkimDuzenlePage({
  params,
}: {
  params: Promise<{ id: string; cropId: string }>;
}) {
  const session = await requirePageWrite("fields");

  const { id, cropId } = await params;

  const [field, crop] = await withTenant(session.user.tenantId, (db) =>
    Promise.all([
      db.field.findFirst({ where: { id }, select: { id: true, name: true } }),
      db.crop.findFirst({ where: { id: cropId } }),
    ])
  );

  if (!field || !crop || crop.fieldId !== id) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Ekim Kaydını Düzenle</h1>
          <p className="text-sm text-muted-foreground">{field.name}</p>
        </div>
        <Link href={`/panel/tarlalar/${id}`} className="text-sm text-muted-foreground hover:underline">
          &larr; Tarlaya dön
        </Link>
      </div>

      <CropForm fieldId={id} crop={crop} />
    </div>
  );
}
