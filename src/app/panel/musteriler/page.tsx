import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canWrite, requirePageView } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { buttonVariants } from "@/components/ui/button";
import { CustomersTable } from "@/components/tables/customers-table";

export default async function MusterilerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePageView("/panel/musteriler");

  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["name", "createdAt"],
    defaultSort: "name",
    defaultDir: "asc",
  });

  const where: Prisma.CustomerWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { phone: { contains: q, mode: "insensitive" } },
          { email: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { [sort]: dir } as Prisma.CustomerOrderByWithRelationInput,
      skip,
      take,
      include: { _count: { select: { sales: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  const canEdit = canWrite(session.user.role, "customers");
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>🧑‍🌾</span> Müşteriler
          </h1>
          <p className="text-sm text-muted-foreground">Toplam {total} müşteri</p>
        </div>
        {canEdit && (
          <Link href="/panel/musteriler/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Müşteri
          </Link>
        )}
      </div>

      <CustomersTable customers={customers} canEdit={canEdit} list={list} />
    </div>
  );
}
