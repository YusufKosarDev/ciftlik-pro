"use client";

import Link from "next/link";
import type { InventoryItem } from "@prisma/client";
import { Package } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { inventoryCategoryLabels } from "@/lib/labels";

export function InventoryTable({
  items,
  canEdit,
}: {
  items: InventoryItem[];
  canEdit: boolean;
}) {
  const columns: Column<InventoryItem>[] = [
    {
      key: "name",
      header: "Kalem",
      sortValue: (i) => i.name,
      cell: (i) => <span className="font-medium text-gray-900">{i.name}</span>,
    },
    {
      key: "category",
      header: "Kategori",
      sortValue: (i) => inventoryCategoryLabels[i.category],
      cell: (i) => inventoryCategoryLabels[i.category],
    },
    {
      key: "quantity",
      header: "Miktar",
      sortValue: (i) => i.quantity,
      cell: (i) => {
        const isCritical = i.quantity <= i.criticalLevel;
        return (
          <span className={isCritical ? "font-semibold text-red-600" : "text-gray-700"}>
            {i.quantity} {i.unit}
            {isCritical && (
              <Badge tone="red" className="ml-2">
                Kritik
              </Badge>
            )}
          </span>
        );
      },
    },
    {
      key: "criticalLevel",
      header: "Kritik",
      sortValue: (i) => i.criticalLevel,
      cell: (i) => (
        <span className="text-gray-500">
          {i.criticalLevel} {i.unit}
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
      cell: (i) => (
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/panel/stok/${i.id}/duzenle`}
            className="text-sm font-medium text-green-600 hover:underline"
          >
            Düzenle
          </Link>
          <DeleteButton
            endpoint={`/api/inventory/${i.id}`}
            itemLabel={i.name}
            kind="Stok kalemi"
          />
        </div>
      ),
    });
  }

  return (
    <DataTable
      data={items}
      columns={columns}
      searchableText={(i) => `${i.name} ${inventoryCategoryLabels[i.category]}`}
      searchPlaceholder="Kalem veya kategori ara..."
      emptyState={
        <EmptyState
          icon={<Package className="h-6 w-6" />}
          title="Henüz stok kalemi eklenmemiş"
          action={
            canEdit ? (
              <Link href="/panel/stok/yeni" className={buttonVariants({ size: "sm" })}>
                Kalem ekle
              </Link>
            ) : undefined
          }
        />
      }
    />
  );
}
