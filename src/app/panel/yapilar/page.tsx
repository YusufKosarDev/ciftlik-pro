import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { buttonVariants } from "@/components/ui/button";
import { StructuresTable } from "@/components/tables/structures-table";

export default async function YapilarPage() {
  const structures = await prisma.structure.findMany({
    orderBy: { createdAt: "desc" },
  });

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "structures") : false;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>🏠</span> Yapilar
          </h1>
          <p className="text-sm text-gray-500">
            Toplam {structures.length} yapi · haritada gosterilir
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/yapilar/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Yapi
          </Link>
        )}
      </div>

      <StructuresTable structures={structures} canEdit={canEdit} />
    </div>
  );
}
