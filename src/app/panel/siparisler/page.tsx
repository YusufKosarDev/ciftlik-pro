import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canWrite, requirePageView } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { OrdersTable } from "@/components/tables/orders-table";

export default async function SiparislerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePageView("/panel/siparisler");

  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["createdAt", "total", "status"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.OrderWhereInput = q
    ? {
        OR: [
          { productName: { contains: q, mode: "insensitive" } },
          { customerName: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [orders, total, pendingCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.OrderOrderByWithRelationInput,
      skip,
      take,
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  const canEdit = canWrite(session.user.role, "orders");
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <span>📋</span> Siparişler
        </h1>
        <p className="text-sm text-muted-foreground">
          Toplam {total} sipariş
          {pendingCount > 0 && (
            <span className="ml-2 text-yellow-700 dark:text-yellow-400">
              · {pendingCount} bekliyor
            </span>
          )}
        </p>
      </div>

      <OrdersTable orders={orders} canEdit={canEdit} list={list} />
    </div>
  );
}
