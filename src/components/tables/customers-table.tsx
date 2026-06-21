"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Customer } from "@prisma/client";
import { Contact } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { ListState } from "@/lib/list-query";

// Liste, musterinin satis sayisini da iceren bir tip kullanir.
export type CustomerRow = Customer & { _count: { sales: number } };

export function CustomersTable({
  customers,
  canEdit,
  list,
}: {
  customers: CustomerRow[];
  canEdit: boolean;
  list: ListState;
}) {
  const t = useTranslations("Customers");
  const tc = useTranslations("Common");

  const columns: Column<CustomerRow>[] = [
    {
      key: "name",
      header: t("name"),
      sortKey: "name",
      cell: (c) => (
        <Link
          href={`/panel/musteriler/${c.id}`}
          className="font-medium text-green-700 hover:underline dark:text-green-400"
        >
          {c.name}
        </Link>
      ),
    },
    { key: "phone", header: t("phone"), cell: (c) => c.phone ?? "-" },
    { key: "email", header: t("email"), cell: (c) => c.email ?? "-" },
    {
      key: "sales",
      header: t("totalSales"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => c._count.sales,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/musteriler/${c.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline dark:text-green-400"
          >
            {tc("edit")}
          </Link>
          <DeleteButton endpoint={`/api/customers/${c.id}`} itemLabel={c.name} kind={t("kind")} />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={customers}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState
          icon={<Contact className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/musteriler/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
