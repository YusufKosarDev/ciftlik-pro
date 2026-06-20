"use client";

import Link from "next/link";
import type { Field } from "@prisma/client";
import { Wheat } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { ListState } from "@/lib/list-query";

export function FieldsTable({
  fields,
  canEdit,
  list,
}: {
  fields: Field[];
  canEdit: boolean;
  list: ListState;
}) {
  const t = useTranslations("Fields");
  const tc = useTranslations("Common");

  const columns: Column<Field>[] = [
    {
      key: "name",
      header: t("name"),
      sortKey: "name",
      cell: (f) => (
        <Link
          href={`/panel/tarlalar/${f.id}`}
          className="font-medium text-green-700 dark:text-green-400 hover:underline"
        >
          {f.name}
        </Link>
      ),
    },
    {
      key: "area",
      header: t("area"),
      sortKey: "area",
      cell: (f) => f.area,
    },
    {
      key: "location",
      header: t("location"),
      sortKey: "location",
      cell: (f) => f.location ?? "-",
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (f) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/tarlalar/${f.id}/duzenle`}
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            {tc("edit")}
          </Link>
          <DeleteButton endpoint={`/api/fields/${f.id}`} itemLabel={f.name} kind={t("kind")} />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={fields}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState
          icon={<Wheat className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/tarlalar/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
