"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@prisma/client";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { useLabels } from "@/lib/use-labels";
import type { ListState } from "@/lib/list-query";

export function InventoryTable({
  items,
  canEdit,
  list,
}: {
  items: InventoryItem[];
  canEdit: boolean;
  list: ListState;
}) {
  const router = useRouter();
  const t = useTranslations("Inventory");
  const tc = useTranslations("Common");
  const { inventoryCategoryLabels } = useLabels();

  const handleBulkDelete = async (ids: string[]) => {
    const res = await fetch("/api/inventory", {
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

  const columns: Column<InventoryItem>[] = [
    {
      key: "name",
      header: t("item"),
      sortKey: "name",
      cell: (i) => <span className="font-medium text-foreground">{i.name}</span>,
    },
    {
      key: "category",
      header: t("category"),
      sortKey: "category",
      cell: (i) => inventoryCategoryLabels[i.category],
    },
    {
      key: "quantity",
      header: t("quantity"),
      sortKey: "quantity",
      cell: (i) => {
        const isCritical = i.quantity <= i.criticalLevel;
        return (
          <span className={isCritical ? "font-semibold text-red-600" : "text-foreground"}>
            {i.quantity} {i.unit}
            {isCritical && (
              <Badge tone="red" className="ml-2">
                {t("criticalBadge")}
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "criticalLevel",
      header: t("critical"),
      sortKey: "criticalLevel",
      cell: (i) => (
        <span className="text-muted-foreground">
          {i.criticalLevel} {i.unit}
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
      cell: (i) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/stok/${i.id}/duzenle`}
            className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
          >
            {tc("edit")}
          </Link>
          <DeleteButton
            endpoint={`/api/inventory/${i.id}`}
            itemLabel={i.name}
            kind={t("kind")}
          />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={items}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder={t("searchPlaceholder")}
      enableSelection={canEdit}
      onBulkDelete={handleBulkDelete}
      csvExportFilename="envanter"
      emptyState={
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title={t("empty")}
          action={
            canEdit ? (
              <Link href="/panel/stok/yeni" className={buttonVariants({ size: "sm" })}>
                {t("add")}
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
