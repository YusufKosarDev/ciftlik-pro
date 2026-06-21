"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Product } from "@prisma/client";
import { Tag } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import type { ListState } from "@/lib/list-query";

function formatMoney(a: number) {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

export function ProductsTable({
  products,
  canEdit,
  list,
}: {
  products: Product[];
  canEdit: boolean;
  list: ListState;
}) {
  const t = useTranslations("Products");
  const tc = useTranslations("Common");

  const columns: Column<Product>[] = [
    {
      key: "name",
      header: t("name"),
      sortKey: "name",
      cell: (p) => <span className="font-medium text-foreground">{p.name}</span>,
    },
    {
      key: "price",
      header: t("price"),
      sortKey: "price",
      cell: (p) => `${formatMoney(p.price)}${p.unit ? ` / ${p.unit}` : ""}`,
    },
    {
      key: "active",
      header: t("status"),
      sortKey: "active",
      cell: (p) =>
        p.active ? <Badge tone="green">{t("activeBadge")}</Badge> : <Badge tone="gray">{t("inactiveBadge")}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/urunler/${p.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            {tc("edit")}
          </Link>
          <DeleteButton endpoint={`/api/products/${p.id}`} itemLabel={p.name} kind={t("kind")} />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={products}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/urunler/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
