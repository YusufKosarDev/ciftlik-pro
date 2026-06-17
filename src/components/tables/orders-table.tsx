"use client";

import type { Order } from "@prisma/client";
import { ClipboardList } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "@/components/order-actions";
import { orderStatusLabels } from "@/lib/labels";
import type { ListState } from "@/lib/list-query";

// Liste, siparisin kalemlerini (urun adi + miktar) da iceren bir tip kullanir.
export type OrderRow = Order & { items: { productName: string; quantity: number }[] };

function formatDate(d: Date) {
  return new Date(d).toLocaleDateString("tr-TR");
}
function formatMoney(a: number) {
  return a.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

const statusTone = {
  PENDING: "yellow",
  CONFIRMED: "green",
  CANCELLED: "gray",
} as const;

export function OrdersTable({
  orders,
  canEdit,
  list,
}: {
  orders: OrderRow[];
  canEdit: boolean;
  list: ListState;
}) {
  const columns: Column<OrderRow>[] = [
    { key: "createdAt", header: "Tarih", sortKey: "createdAt", cell: (o) => formatDate(o.createdAt) },
    {
      key: "product",
      header: "Ürünler",
      cell: (o) => {
        const first = o.items[0];
        const label = first
          ? o.items.length === 1
            ? `${first.productName} × ${first.quantity}`
            : `${first.productName} +${o.items.length - 1} kalem`
          : "-";
        return <span className="font-medium text-foreground">{label}</span>;
      },
    },
    {
      key: "customer",
      header: "Müşteri",
      cell: (o) => (
        <span>
          {o.customerName}
          {o.customerPhone ? <span className="text-muted-foreground"> · {o.customerPhone}</span> : null}
        </span>
      ),
    },
    {
      key: "total",
      header: "Tutar",
      sortKey: "total",
      headerClassName: "text-right",
      className: "text-right",
      cell: (o) => <span className="font-medium text-foreground">{formatMoney(o.total)}</span>,
    },
    {
      key: "payment",
      header: "Ödeme",
      cell: (o) =>
        o.paymentStatus === "PAID" ? (
          <Badge tone="green">Ödendi</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: "Durum",
      sortKey: "status",
      cell: (o) => <Badge tone={statusTone[o.status]}>{orderStatusLabels[o.status]}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: "İşlemler",
      headerClassName: "text-right",
      className: "text-right",
      cell: (o) => <OrderActions id={o.id} status={o.status} />,
    });
  }

  return (
    <DataTable
      data={orders}
      columns={columns}
      list={list}
      searchable
      searchPlaceholder="Ürün veya müşteri ara..."
      emptyState={
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title="Henüz sipariş yok" />
      }
    />
  );
}
