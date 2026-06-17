"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-1.5 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

// Herkese acik (odemesiz) tek-urun siparis formu. /api/orders'a POST eder.
export function StoreOrderForm({ productId }: { productId: string }) {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      productId,
      quantity: String(fd.get("quantity")),
      customerName: String(fd.get("customerName")),
      customerPhone: String(fd.get("customerPhone")),
      note: String(fd.get("note")),
    };

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Sipariş alınamadı, lütfen tekrar deneyin");
      return;
    }
    setDone(true);
    toast.success("Siparişiniz alındı!");
  }

  if (done) {
    return (
      <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-500/15 dark:text-green-400">
        ✓ Siparişiniz alındı. En kısa sürede sizinle iletişime geçilecek.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="quantity"
          type="number"
          min="1"
          step="1"
          defaultValue={1}
          required
          aria-label="Adet"
          className={`${inputClass} w-20`}
        />
        <input
          name="customerName"
          type="text"
          required
          placeholder="Adınız"
          aria-label="Adınız"
          className={inputClass}
        />
      </div>
      <input
        name="customerPhone"
        type="text"
        placeholder="Telefon (opsiyonel)"
        aria-label="Telefon"
        className={inputClass}
      />
      <input type="hidden" name="note" value="" />
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <Button type="submit" size="sm" loading={loading} className="w-full">
        Sipariş ver
      </Button>
    </form>
  );
}
