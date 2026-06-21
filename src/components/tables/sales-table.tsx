"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Sale } from "@prisma/client";
import { ShoppingCart } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { ListState } from "@/lib/list-query";

import { useFormat } from "@/lib/format";

// Liste, satisa bagli musterinin adini da iceren bir tip kullanir.
export type SaleRow = Sale & { customer: { name: string } | null };

export function SalesTable({
  sales,
  canEdit,
  list,
}: {
  sales: SaleRow[];
  canEdit: boolean;
  list: ListState;
}) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Common");
  const { formatDate, formatMoney } = useFormat();

  const columns: Column<SaleRow>[] = [
    { key: "date", header: t("date"), sortKey: "date", cell: (s) => formatDate(s.date) },
    {
      key: "item",
      header: t("item"),
      sortKey: "item",
      cell: (s) => <span className="font-medium text-foreground">{s.item}</span>,
    },
    { key: "customer", header: t("customer"), sortKey: "customer", cell: (s) => s.customer?.name ?? "-" },
    {
      key: "quantity",
      header: t("quantity"),
      cell: (s) => (s.quantity != null ? `${s.quantity} ${s.unit ?? ""}`.trim() : "-"),
    },
    {
      key: "amount",
      header: t("amount"),
      sortKey: "amount",
      headerClassName: "text-right",
      className: "text-right",
      cell: (s) => <span className="font-medium text-green-600 dark:text-green-400">{formatMoney(s.amount)}</span>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/satis/${s.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            {tc("edit")}
          </Link>
          <DeleteButton endpoint={`/api/sales/${s.id}`} itemLabel={s.item} kind={t("kind")} />
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
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState
          icon={<ShoppingCart className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/satis/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
