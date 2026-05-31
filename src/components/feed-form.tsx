"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

type FeedItem = { id: string; name: string; quantity: number; unit: string };

export function FeedForm({ items }: { items: FeedItem[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      inventoryItemId: String(fd.get("inventoryItemId")),
      date: String(fd.get("date")),
      quantity: String(fd.get("quantity")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Kayit basarisiz, lutfen tekrar deneyin");
      return;
    }

    toast.success("Tüketim kaydedildi, stok güncellendi.");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <label htmlFor="fitem" className="mb-1 block text-xs font-medium text-gray-600">
            Yem Kalemi *
          </label>
          <select id="fitem" name="inventoryItemId" required className={inputClass}>
            {items.map((i) => (
              <option key={i.id} value={i.id}>
                {i.name} ({i.quantity} {i.unit} mevcut)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fdate" className="mb-1 block text-xs font-medium text-gray-600">
            Tarih *
          </label>
          <input id="fdate" name="date" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="fqty" className="mb-1 block text-xs font-medium text-gray-600">
            Miktar *
          </label>
          <input
            id="fqty"
            name="quantity"
            type="number"
            step="0.1"
            min="0"
            required
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-4">
          <label htmlFor="fnotes" className="mb-1 block text-xs font-medium text-gray-600">
            Not
          </label>
          <input id="fnotes" name="notes" type="text" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading}>
        Tüketim Ekle
      </Button>
    </form>
  );
}
