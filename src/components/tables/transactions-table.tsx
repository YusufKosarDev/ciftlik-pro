"use client";
 
import Link from "next/link";
import type { Transaction } from "@prisma/client";
import { Wallet } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLabels } from "@/lib/use-labels";
import type { ListState } from "@/lib/list-query";
 
function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR");
}
function formatMoney(a: number) {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}
 
export function TransactionsTable({
  transactions,
  canEdit,
  list,
}: {
  transactions: Transaction[];
  canEdit: boolean;
  list: ListState;
}) {
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const { transactionTypeLabels } = useLabels();

  const columns: Column<Transaction>[] = [
    {
      key: "date",
      header: t("date"),
      sortKey: "date",
      cell: (tr) => formatDate(tr.date),
    },
    {
      key: "type",
      header: t("type"),
      sortKey: "type",
      cell: (tr) => (
        <Badge tone={tr.type === "INCOME" ? "green" : "red"}>
          {transactionTypeLabels[tr.type]}
        </Badge>
      ),
    },
    { key: "category", header: t("category"), sortKey: "category", cell: (tr) => tr.category },
    {
      key: "amount",
      header: t("amount"),
      sortKey: "amount",
      headerClassName: "text-right",
      className: "text-right",
      cell: (tr) => (
        <span
          className={
            tr.type === "INCOME" ? "font-medium text-green-600" : "font-medium text-red-600"
          }
        >
          {tr.type === "INCOME" ? "+" : "-"}
          {formatMoney(tr.amount)}
        </span>
      ),
    },
  ];
 
  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (tr) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/finans/${tr.id}/duzenle`}
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            {tc("edit")}
          </Link>
          <DeleteButton
            endpoint={`/api/transactions/${tr.id}`}
            itemLabel={tr.category}
            kind={t("kind")}
          />
        </div>
      ),
    });
  }
 
  return (
    <DataTable
      data={transactions}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/finans/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
