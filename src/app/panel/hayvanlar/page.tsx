import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
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

  const [animals, total, session] = await Promise.all([
    prisma.animal.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.AnimalOrderByWithRelationInput,
      skip,
      take,
    }),
    prisma.animal.count({ where }),
    auth(),
  ]);

  const canEdit = session ? canWrite(session.user.role, "animals") : false;
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <span>🐮</span> Hayvanlar
          </h1>
          <p className="text-sm text-gray-500">Toplam {total} kayit</p>
        </div>
        {canEdit && (
          <Link href="/panel/hayvanlar/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Hayvan
          </Link>
        )}
      </div>

      <AnimalsTable animals={animals} canEdit={canEdit} list={list} />
    </div>
  );
}
