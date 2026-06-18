import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { canWrite, requirePageView } from "@/lib/authz";
import { parseListParams, type ListState } from "@/lib/list-query";
import { withTenant } from "@/lib/tenant-prisma";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/button";
import { ProductsTable } from "@/components/tables/products-table";

export default async function UrunlerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requirePageView("/panel/urunler");

  const { page, q, sort, dir, skip, take } = parseListParams(await searchParams, {
    sortableKeys: ["name", "price", "active", "createdAt"],
    defaultSort: "createdAt",
    defaultDir: "desc",
  });

  const where: Prisma.ProductWhereInput = q
    ? {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

  const { products, total } = await withTenant(session.user.tenantId, async (db) => {
    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        orderBy: { [sort]: dir } as Prisma.ProductOrderByWithRelationInput,
        skip,
        take,
      }),
      db.product.count({ where }),
    ]);
    return { products, total };
  });

  // Bu tenant'in vitrin slug'i (kendi magazasina derin baglanti icin). Tenant RLS disi.
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.user.tenantId },
    select: { slug: true },
  });

  const canEdit = canWrite(session.user.role, "products");
  const list: ListState = { total, page, pageSize: take, q, sort, dir };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span>🏷️</span> Ürünler
          </h1>
          <p className="text-sm text-muted-foreground">
            Toplam {total} ürün · herkese açık{" "}
            <Link
              href={tenant ? `/magaza/${tenant.slug}` : "/magaza"}
              className="text-green-600 hover:underline dark:text-green-400"
            >
              mağaza
            </Link>
          </p>
        </div>
        {canEdit && (
          <Link href="/panel/urunler/yeni" className={buttonVariants({ size: "sm" })}>
            + Yeni Ürün
          </Link>
        )}
      </div>

      <ProductsTable products={products} canEdit={canEdit} list={list} />
    </div>
  );
}
