"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { DeleteButton } from "@/components/delete-button";

// Updates an order's status (confirm / cancel) and deletes it. Shown only in the
// authorised (admin-side) table.
export function OrderActions({ id, status }: { id: string; status: OrderStatus }) {
  const t = useTranslations("Orders");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function setStatus(next: OrderStatus) {
    setLoading(true);
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setLoading(false);
    if (res.ok) {
      toast.success(t("statusUpdated"));
      router.refresh();
    } else {
      toast.error(t("actionFailed"));
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {status !== "CONFIRMED" && (
        <button
          onClick={() => setStatus("CONFIRMED")}
          disabled={loading}
          className="text-sm font-medium text-green-700 hover:underline disabled:opacity-50 dark:text-green-400"
        >
          {t("confirm")}
        </button>
      )}
      {status !== "CANCELLED" && (
        <button
          onClick={() => setStatus("CANCELLED")}
          disabled={loading}
          className="text-sm font-medium text-muted-foreground hover:underline disabled:opacity-50"
        >
          {t("cancel")}
        </button>
      )}
      <DeleteButton endpoint={`/api/orders/${id}`} itemLabel={t("itemLabel")} kind={t("kindLabel")} />
    </div>
  );
}
