import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { canWrite, requirePageView } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
import { buttonVariants } from "@/components/ui/button";
import { SalesTable } from "@/components/tables/sales-table";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

export default async function SatisPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // Satis ticari/finansal veridir: yalnizca menusunde gorunen roller (ADMIN,
  // ACCOUNTANT) acabilir.
  const session = await requirePageView("/panel/satis");

  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["date", "item", "customer", "amount"],
    defaultSort: "date",
    defaultDir: "desc",
  });

  const where: Prisma.SaleWhereInput = q
    ? {
        OR: [
          { item: { contains: q, mode: "insensitive" } },
          { customer: { name: { contains: q, mode: "insensitive" } } },
        ],
      }
    : {};

  // Musteri adina gore siralama iliskili tablo uzerinden yapilir.
  const orderBy = (
    sort === "customer" ? { customer: { name: dir } } : { [sort]: dir }
  ) as Prisma.SaleOrderByWithRelationInput;

  const { sales, total, totalAgg } = await withTenant(session.user.tenantId, async (db) => {
    const [sales, total, totalAgg] = await Promise.all([
      db.sale.findMany({
        where,
        orderBy,
        skip,
        take,
        include: { customer: { select: { name: true } } },
      }),
      db.sale.count({ where }),
      // Tum zamanlarin toplam satis tutari (arama/sayfadan bagimsiz).
      db.sale.aggregate({ _sum: { amount: true } }),
    ]);
    return { sales, total, totalAgg };
  });

  const canEdit = canWrite(session.user.role, "sales");
  const list: ListState = { total, page, pageSize: take, q, sort, dir };
  const totalAmount = totalAgg._sum.amount ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>🛒</span> Satış
          </h1>
          <p className="text-sm text-muted-foreground">
            Toplam {total} kayıt · {formatMoney(totalAmount)} ciro
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/satis/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Satış
          </Link>
        )}
      </div>

      <SalesTable sales={sales} canEdit={canEdit} list={list} />
    </div>
  );
}
