"use client";

import Link from "next/link";
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
  const columns: Column<Product>[] = [
    {
      key: "name",
      header: "Ürün",
      sortKey: "name",
      cell: (p) => <span className="font-medium text-foreground">{p.name}</span>,
    },
    {
      key: "price",
      header: "Fiyat",
      sortKey: "price",
      cell: (p) => `${formatMoney(p.price)}${p.unit ? ` / ${p.unit}` : ""}`,
    },
    {
      key: "active",
      header: "Durum",
      sortKey: "active",
      cell: (p) =>
        p.active ? <Badge tone="green">Satışta</Badge> : <Badge tone="gray">Pasif</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/urunler/${p.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            Düzenle
          </Link>
          <DeleteButton endpoint={`/api/products/${p.id}`} itemLabel={p.name} kind="Ürün" />
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
      searchPlaceholder="Ürün ara..."
      emptyState={
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title="Henüz ürün yok"
          action={
            canEdit ? (
              <Link href="/panel/urunler/yeni" className={buttonVariants({ size: "sm" })}>
                Ürün ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
