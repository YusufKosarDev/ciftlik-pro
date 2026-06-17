"use client";

import Link from "next/link";
import type { Sale } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { ListState } from "@/lib/list-query";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR");
}
function formatMoney(a: number) {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

export function SalesTable({
  sales,
  canEdit,
  list,
}: {
  sales: Sale[];
  canEdit: boolean;
  list: ListState;
}) {
  const columns: Column<Sale>[] = [
    { key: "date", header: "Tarih", sortKey: "date", cell: (s) => formatDate(s.date) },
    {
      key: "item",
      header: "Satılan",
      sortKey: "item",
      cell: (s) => <span className="font-medium text-foreground">{s.item}</span>,
    },
    { key: "customer", header: "Müşteri", sortKey: "customer", cell: (s) => s.customer ?? "-" },
    {
      key: "quantity",
      header: "Miktar",
      cell: (s) => (s.quantity != null ? `${s.quantity} ${s.unit ?? ""}`.trim() : "-"),
    },
    {
      key: "amount",
      header: "Tutar",
      sortKey: "amount",
      headerClassName: "text-right",
      className: "text-right",
      cell: (s) => <span className="font-medium text-green-600 dark:text-green-400">{formatMoney(s.amount)}</span>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/satis/${s.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            Düzenle
          </Link>
          <DeleteButton endpoint={`/api/sales/${s.id}`} itemLabel={s.item} kind="Satış" />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={sales}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder="Ürün veya müşteri ara..."
      emptyState={
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title="Henüz satış kaydı yok"
          action={
            canEdit ? (
              <Link href="/panel/satis/yeni" className={buttonVariants({ size: "sm" })}>
                Satış ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
