"use client";

import Link from "next/link";
import type { Animal } from "@prisma/client";
import { PawPrint } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { speciesLabels, genderLabels, statusLabels } from "@/lib/labels";

const statusTone = {
  ACTIVE: "green",
  SOLD: "yellow",
  DECEASED: "gray",
} as const;

export function AnimalsTable({
  animals,
  canEdit,
}: {
  animals: Animal[];
  canEdit: boolean;
}) {
  const columns: Column<Animal>[] = [
    {
      key: "tagNumber",
      header: "Kulak No",
      sortValue: (a) => a.tagNumber,
      cell: (a) => (
        <Link
          href={`/panel/hayvanlar/${a.id}`}
          className="font-medium text-green-700 hover:underline"
        >
          {a.tagNumber}
        </Link>
      ),
    },
    { key: "name", header: "Ad", sortValue: (a) => a.name ?? "", cell: (a) => a.name ?? "-" },
    {
      key: "species",
      header: "Tür",
      sortValue: (a) => speciesLabels[a.species],
      cell: (a) => speciesLabels[a.species],
    },
    { key: "gender", header: "Cinsiyet", cell: (a) => genderLabels[a.gender] },
    {
      key: "status",
      header: "Durum",
      sortValue: (a) => a.status,
      cell: (a) => <Badge tone={statusTone[a.status]}>{statusLabels[a.status]}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (a) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/hayvanlar/${a.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Düzenle
          </Link>
          <DeleteButton
            endpoint={`/api/animals/${a.id}`}
            itemLabel={a.name ?? a.tagNumber}
            kind="Hayvan"
          />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={animals}
      columns={columns}
      searchableText={(a) => `${a.tagNumber} ${a.name ?? ""} ${a.breed ?? ""}`}
      searchPlaceholder="Kulak no, ad veya ırk ara..."
      emptyState={
        <EmptyState
          icon={<PawPrint className="h-6 w-6" />}
          title="Henüz hayvan eklenmemiş"
          action={
            canEdit ? (
              <Link href="/panel/hayvanlar/yeni" className={buttonVariants({ size: "sm" })}>
                Hayvan ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
