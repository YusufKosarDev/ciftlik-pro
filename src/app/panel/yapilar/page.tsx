import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { buttonVariants } from "@/components/ui/button";
import { StructuresTable } from "@/components/tables/structures-table";

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

  const [structures, total, session] = await Promise.all([
    prisma.structure.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.StructureOrderByWithRelationInput,
      skip,
      take,
    }),
    prisma.structure.count({ where }),
    auth(),
  ]);

  const canEdit = session ? canWrite(session.user.role, "structures") : false;
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>🏠</span> Yapilar
          </h1>
          <p className="text-sm text-gray-500">
            Toplam {total} yapi · haritada gosterilir
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/yapilar/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Yapi
          </Link>
        )}
      </div>

      <StructuresTable structures={structures} canEdit={canEdit} list={list} />
    </div>
  );
}
