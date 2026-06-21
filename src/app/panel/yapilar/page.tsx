import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
import { buttonVariants } from "@/components/ui/button";
import { StructuresTable } from "@/components/tables/structures-table";
import { getTranslations } from "next-intl/server";

export default async function YapilarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["name", "type"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.StructureWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const session = await auth();
  const t = await getTranslations("Structures");
  const canEdit = session ? canWrite(session.user.role, "structures") : false;
  const { structures, total } = await withTenant(session!.user.tenantId, async (db) => {
    const [structures, total] = await Promise.all([
      db.structure.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.StructureOrderByWithRelationInput,
        skip,
        take,
      }),
      db.structure.count({ where }),
    ]);
    return { structures, total };
  });
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>🏠</span> {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("totalDescription", { count: total })}
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/yapilar/yeni" className={buttonVariants({ size: "sm" })}>
            + {t("new")}
          </Link>
        )}
      </div>

      <StructuresTable structures={structures} canEdit={canEdit} list={list} />
    </div>
  );
}
