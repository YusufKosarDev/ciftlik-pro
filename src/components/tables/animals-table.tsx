"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Animal } from "@prisma/client";
import { PawPrint } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLabels } from "@/lib/use-labels";
import type { ListState } from "@/lib/list-query";

const statusTone = {
  ACTIVE: "green",
  SOLD: "yellow",
  DECEASED: "gray",
} as const;

export function AnimalsTable({
  animals,
  canEdit,
  list,
}: {
  animals: Animal[];
  canEdit: boolean;
  list: ListState;
}) {
  const router = useRouter();
  const t = useTranslations("Animals");
  const tc = useTranslations("Common");
  const { speciesLabels, genderLabels, statusLabels } = useLabels();

  const handleBulkDelete = async (ids: string[]) => {
    const res = await fetch("/api/animals", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || "Silme hatası");
    }
    router.refresh();
  };

  const columns: Column<Animal>[] = [
    {
      key: "tagNumber",
      header: t("tagNumber"),
      sortKey: "tagNumber",
      cell: (a) => (
        <Link
          href={`/panel/hayvanlar/${a.id}`}
          className="font-medium text-green-700 dark:text-green-400 hover:underline"
        >
          {a.tagNumber}
        </Link>
      ),
    },
    { key: "name", header: t("name"), sortKey: "name", cell: (a) => a.name ?? "-" },
    {
      key: "species",
      header: t("species"),
      sortKey: "species",
      cell: (a) => speciesLabels[a.species],
    },
    { key: "gender", header: t("gender"), cell: (a) => genderLabels[a.gender] },
    {
      key: "status",
      header: t("status"),
      sortKey: "status",
      cell: (a) => <Badge tone={statusTone[a.status]}>{statusLabels[a.status]}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
      headerClassName: "text-right",
      className: "text-right",
      cell: (a) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/hayvanlar/${a.id}/duzenle`}
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            {tc("edit")}
          </Link>
          <DeleteButton
            endpoint={`/api/animals/${a.id}`}
            itemLabel={a.name ?? a.tagNumber}
            kind={t("kind")}
          />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={animals}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      enableSelection={canEdit}
      onBulkDelete={handleBulkDelete}
      csvExportFilename="hayvanlar"
      emptyState={
        <EmptyState
          icon={<PawPrint className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/hayvanlar/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
