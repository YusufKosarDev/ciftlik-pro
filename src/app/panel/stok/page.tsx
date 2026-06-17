import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { buttonVariants } from "@/components/ui/button";
import { InventoryTable } from "@/components/tables/inventory-table";

export default async function StokPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["name", "category", "quantity", "criticalLevel"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.InventoryItemWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { notes: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  // Kritik sayim kolon-kolon karsilastirma gerektirir (quantity <= criticalLevel);
  // Prisma standart where ile yapamaz, bu yuzden DB-tarafi COUNT (tum kayitlari
  // bellege cekmeden) kullaniyoruz.
  const [items, total, session, criticalRows] = await Promise.all([
    prisma.inventoryItem.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.InventoryItemOrderByWithRelationInput,
      skip,
      take,
    }),
    prisma.inventoryItem.count({ where }),
    auth(),
    prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM "InventoryItem" WHERE "quantity" <= "criticalLevel"`,
  ]);

  const criticalCount = criticalRows[0]?.count ?? 0;
  const canEdit = session ? canWrite(session.user.role, "inventory") : false;
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>📦</span> Stok & Envanter
          </h1>
          <p className="text-sm text-muted-foreground">
            Toplam {total} kalem
            {criticalCount > 0 && (
              <span className="ml-2 text-red-600">
                · {criticalCount} kalem kritik seviyede
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/stok/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Kalem
          </Link>
        )}
      </div>

      <InventoryTable items={items} canEdit={canEdit} list={list} />
    </div>
  );
}
