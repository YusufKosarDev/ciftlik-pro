import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { buttonVariants } from "@/components/ui/button";
import { FieldsTable } from "@/components/tables/fields-table";

export default async function TarlalarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["name", "area", "location"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.FieldWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [fields, total, session] = await Promise.all([
    prisma.field.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.FieldOrderByWithRelationInput,
      skip,
      take,
    }),
    prisma.field.count({ where }),
    auth(),
  ]);

  const canEdit = session ? canWrite(session.user.role, "fields") : false;
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>🌾</span> Tarlalar
          </h1>
          <p className="text-sm text-muted-foreground">Toplam {total} kayit</p>
        </div>
        {canEdit && (
          <Link href="/panel/tarlalar/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Tarla
          </Link>
        )}
      </div>

      <FieldsTable fields={fields} canEdit={canEdit} list={list} />
    </div>
  );
}
