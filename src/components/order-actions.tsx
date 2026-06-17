"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { OrderStatus } from "@prisma/client";
import { DeleteButton } from "@/components/delete-button";

// Siparis durumunu gunceller (Onayla / Iptal) + silme. Yalnizca yetkili (admin
// tarafi) tabloda gosterilir.
export function OrderActions({ id, status }: { id: string; status: OrderStatus }) {
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
      toast.success("Durum güncellendi.");
      router.refresh();
    } else {
      toast.error("İşlem başarısız.");
    }
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {status !== "CONFIRMED" && (
        <button
          onClick={() => setStatus("CONFIRMED")}
          disabled={loading}
          className="text-sm font-medium text-green-600 hover:underline disabled:opacity-50 dark:text-green-400"
        >
          Onayla
        </button>
      )}
      {status !== "CANCELLED" && (
        <button
          onClick={() => setStatus("CANCELLED")}
          disabled={loading}
          className="text-sm font-medium text-muted-foreground hover:underline disabled:opacity-50"
        >
          İptal
        </button>
      )}
      <DeleteButton endpoint={`/api/orders/${id}`} itemLabel="sipariş" kind="Sipariş" />
    </div>
  );
}
