"use client";

import Link from "next/link";
import type { Structure } from "@prisma/client";
import { Home } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { structureTypeLabels } from "@/lib/labels";
import type { ListState } from "@/lib/list-query";

export function StructuresTable({
  structures,
  canEdit,
  list,
}: {
  structures: Structure[];
  canEdit: boolean;
  list: ListState;
}) {
  const columns: Column<Structure>[] = [
    {
      key: "name",
      header: "Ad",
      sortKey: "name",
      cell: (s) => <span className="font-medium text-foreground">{s.name}</span>,
    },
    {
      key: "type",
      header: "Tür",
      sortKey: "type",
      cell: (s) => <Badge tone="amber">{structureTypeLabels[s.type]}</Badge>,
    },
    {
      key: "notes",
      header: "Not",
      cell: (s) => <span className="text-muted-foreground">{s.notes ?? "-"}</span>,
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
            href={`/panel/yapilar/${s.id}/duzenle`}
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            Düzenle
          </Link>
          <DeleteButton endpoint={`/api/structures/${s.id}`} itemLabel={s.name} kind="Yapı" />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={structures}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder="Ad veya tür ara..."
      emptyState={
        <EmptyState
          icon={<Home className="h-6 w-6" />}
          title="Henüz yapı eklenmemiş"
          action={
            canEdit ? (
              <Link href="/panel/yapilar/yeni" className={buttonVariants({ size: "sm" })}>
                Yapı ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
