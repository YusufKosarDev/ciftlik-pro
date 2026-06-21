"use client";

import type { Order } from "@prisma/client";
import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { DataTable, type Column } from "@/components/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { OrderActions } from "@/components/order-actions";
import { useLabels } from "@/lib/use-labels";
import type { ListState } from "@/lib/list-query";

import { useFormat } from "@/lib/format";

// Liste, siparisin kalemlerini (urun adi + miktar) da iceren bir tip kullanir.
export type OrderRow = Order & { items: { productName: string; quantity: number }[] };

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
  const t = useTranslations("Orders");
  const tc = useTranslations("Common");
  const { formatDate, formatMoney } = useFormat();
  const { orderStatusLabels, paymentStatusLabels } = useLabels();

  const columns: Column<OrderRow>[] = [
    { key: "createdAt", header: t("date"), sortKey: "createdAt", cell: (o) => formatDate(o.createdAt) },
    {
      key: "product",
      header: t("items"),
      cell: (o) => {
        const first = o.items[0];
        const label = first
          ? o.items.length === 1
            ? `${first.productName} × ${first.quantity}`
            : `${first.productName} ${t("itemsCount", { count: o.items.length - 1 })}`
          : "-";
        return <span className="font-medium text-foreground">{label}</span>;
      },
    },
    {
      key: "customer",
      header: t("customerName"),
      cell: (o) => (
        <span>
          {o.customerName}
          {o.customerPhone ? <span className="text-muted-foreground"> · {o.customerPhone}</span> : null}
        </span>
      ),
    },
    {
      key: "total",
      header: t("total"),
      sortKey: "total",
      headerClassName: "text-right",
      className: "text-right",
      cell: (o) => <span className="font-medium text-foreground">{formatMoney(o.total)}</span>,
    },
    {
      key: "payment",
      header: t("paymentStatus"),
      cell: (o) =>
        o.paymentStatus === "PAID" ? (
          <Badge tone="green">{paymentStatusLabels.PAID}</Badge>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      key: "status",
      header: t("status"),
      sortKey: "status",
      cell: (o) => <Badge tone={statusTone[o.status]}>{orderStatusLabels[o.status]}</Badge>,
    },
  ];

  if (canEdit) {
    columns.push({
      key: "actions",
      header: tc("actions"),
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
      searchPlaceholder={t("searchPlaceholder")}
      emptyState={
        <EmptyState icon={<ClipboardList className="h-6 w-6" />} title={t("empty")} />
      }
    />
  );
}
