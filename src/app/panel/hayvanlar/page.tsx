import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
import { buttonVariants } from "@/components/ui/button";
import { AnimalsTable } from "@/components/tables/animals-table";

export default async function HayvanlarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["tagNumber", "name", "species", "status"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.AnimalWhereInput = q
    ? {
        OR: [
          { tagNumber: { contains: q, mode: "insensitive" } },
          { name: { contains: q, mode: "insensitive" } },
          { breed: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "animals") : false;
  const { animals, total } = await withTenant(session!.user.tenantId, async (db) => {
    const [animals, total] = await Promise.all([
      db.animal.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.AnimalOrderByWithRelationInput,
        skip,
        take,
      }),
      db.animal.count({ where }),
    ]);
    return { animals, total };
  });
  const list: ListState = { total, page, pageSize: take, q, sort, dir };
  const t = await getTranslations("Animals");
  const tc = await getTranslations("Common");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>🐮</span> {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{tc("totalRecords", { count: total })}</p>
        </div>
        {canEdit && (
          <Link href="/panel/hayvanlar/yeni" className={buttonVariants({ size: "sm" })}>
            + {t("new")}
          </Link>
        )}
      </div>

      <AnimalsTable animals={animals} canEdit={canEdit} list={list} />
    </div>
  );
}
