import Link from "next/link";
import { notFound } from "next/navigation";
import { withTenant } from "@/lib/tenant-prisma";
import { StructureForm } from "@/components/structure-form";
import { requirePageWrite } from "@/lib/authz";
import { getTranslations } from "next-intl/server";

export default async function YapiDuzenlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requirePageWrite("structures");
  const t = await getTranslations("Structures");
  const tc = await getTranslations("Common");

  const { id } = await params;
  const structure = await withTenant(session.user.tenantId, (db) =>
    db.structure.findFirst({ where: { id } })
  );

  if (!structure) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">
          {tc("edit")} - {t("kind")}
        </h1>
        <Link href="/panel/yapilar" className="text-sm text-muted-foreground hover:underline">
          &larr; {tc("backToList")}
        </Link>
      </div>

      <StructureForm structure={structure} />
    </div>
  );
}
