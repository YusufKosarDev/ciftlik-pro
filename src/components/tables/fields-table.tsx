"use client";

import Link from "next/link";
import type { Field } from "@prisma/client";
import { Wheat } from "lucide-react";
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
  const columns: Column<Field>[] = [
    {
      key: "name",
      header: "Ad",
      sortKey: "name",
      cell: (f) => (
        <Link
          href={`/panel/tarlalar/${f.id}`}
          className="font-medium text-green-700 hover:underline"
        >
          {f.name}
        </Link>
      ),
    },
    {
      key: "area",
      header: "Alan (dönüm)",
      sortKey: "area",
      cell: (f) => f.area,
    },
    {
      key: "location",
      header: "Konum",
      sortKey: "location",
      cell: (f) => f.location ?? "-",
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (f) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/tarlalar/${f.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Düzenle
          </Link>
          <DeleteButton endpoint={`/api/fields/${f.id}`} itemLabel={f.name} kind="Tarla" />
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
      searchPlaceholder="Ad veya konum ara..."
      emptyState={
        <EmptyState
          icon={<Wheat className="h-6 w-6" />}
          title="Henüz tarla eklenmemiş"
          action={
            canEdit ? (
              <Link href="/panel/tarlalar/yeni" className={buttonVariants({ size: "sm" })}>
                Tarla ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
