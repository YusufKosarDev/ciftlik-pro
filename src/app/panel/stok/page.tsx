import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { canWrite } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
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
  const session = await auth();
  const canEdit = session ? canWrite(session.user.role, "inventory") : false;
  const { items, total, criticalRows } = await withTenant(session!.user.tenantId, async (db) => {
    const [items, total, criticalRows] = await Promise.all([
      db.inventoryItem.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.InventoryItemOrderByWithRelationInput,
        skip,
        take,
      }),
      db.inventoryItem.count({ where }),
      // RLS baglaminda calistigindan bu raw COUNT da tenant-kapsamli olur.
      db.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*)::int AS count FROM "InventoryItem" WHERE "quantity" <= "criticalLevel"`,
    ]);
    return { items, total, criticalRows };
  });

  const criticalCount = criticalRows[0]?.count ?? 0;
  const list: ListState = { total, page, pageSize: take, q, sort, dir };
  const t = await getTranslations("Inventory");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>📦</span> {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("totalItems", { count: total })}
            {criticalCount > 0 && (
              <span className="ml-2 text-red-600">
                {" "}
                {t("criticalSuffix", { count: criticalCount })}
              </span>
            )}
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/stok/yeni" className={buttonVariants({ size: "sm" })}>
            + {t("new")}
          </Link>
        )}
      </div>

      <InventoryTable items={items} canEdit={canEdit} list={list} />
    </div>
  );
}
