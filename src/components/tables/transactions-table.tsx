"use client";

import Link from "next/link";
import type { Transaction } from "@prisma/client";
import { Wallet } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { transactionTypeLabels } from "@/lib/labels";

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR");
}
function formatMoney(a: number) {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

export function TransactionsTable({
  transactions,
  canEdit,
}: {
  transactions: Transaction[];
  canEdit: boolean;
}) {
  const columns: Column<Transaction>[] = [
    {
      key: "date",
      header: "Tarih",
      sortValue: (t) => new Date(t.date).getTime(),
      cell: (t) => formatDate(t.date),
    },
    {
      key: "type",
      header: "Tür",
      sortValue: (t) => t.type,
      cell: (t) => (
        <Badge tone={t.type === "INCOME" ? "green" : "red"}>
          {transactionTypeLabels[t.type]}
        </Badge>
      ),
    },
    { key: "category", header: "Kategori", sortValue: (t) => t.category, cell: (t) => t.category },
    {
      key: "amount",
      header: "Tutar",
      sortValue: (t) => t.amount,
      headerClassName: "text-right",
      className: "text-right",
      cell: (t) => (
        <span
          className={
            t.type === "INCOME" ? "font-medium text-green-600" : "font-medium text-red-600"
          }
        >
          {t.type === "INCOME" ? "+" : "-"}
          {formatMoney(t.amount)}
        </span>
      ),
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (t) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/finans/${t.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Düzenle
          </Link>
          <DeleteButton
            endpoint={`/api/transactions/${t.id}`}
            itemLabel={t.category}
            kind="İşlem"
          />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={transactions}
      columns={columns}
      searchableText={(t) => `${t.category} ${transactionTypeLabels[t.type]}`}
      searchPlaceholder="Kategori ara..."
      emptyState={
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title="Henüz işlem eklenmemiş"
          action={
            canEdit ? (
              <Link href="/panel/finans/yeni" className={buttonVariants({ size: "sm" })}>
                İşlem ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
