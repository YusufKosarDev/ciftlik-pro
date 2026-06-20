"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLabels } from "@/lib/use-labels";
import type { InventoryItem } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function InventoryForm({ item }: { item?: InventoryItem }) {
  const router = useRouter();
  const t = useTranslations("Inventory");
  const tc = useTranslations("Common");
  const { inventoryCategoryLabels } = useLabels();
  const isEdit = Boolean(item);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      category: String(fd.get("category")),
      quantity: String(fd.get("quantity")),
      unit: String(fd.get("unit")),
      criticalLevel: String(fd.get("criticalLevel")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(
      isEdit ? `/api/inventory/${item!.id}` : "/api/inventory",
      {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? tc("saveFailed"));
      return;
    }

    toast.success(t("saved"));
    router.push("/panel/stok");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className={labelClass}>
            {t("nameLabel")} *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={item?.name ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            {t("category")} *
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={item?.category ?? "FEED"}
            className={inputClass}
          >
            {Object.entries(inventoryCategoryLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className={labelClass}>
            {t("quantity")} *
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.1"
            min="0"
            required
            defaultValue={item?.quantity ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="unit" className={labelClass}>
            {t("unit")} *
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            required
            placeholder={t("unitPlaceholder")}
            defaultValue={item?.unit ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="criticalLevel" className={labelClass}>
            {t("criticalLevel")}
          </label>
          <input
            id="criticalLevel"
            name="criticalLevel"
            type="number"
            step="0.1"
            min="0"
            defaultValue={item?.criticalLevel ?? 0}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          {t("notes")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={item?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/stok"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          {tc("cancel")}
        </Link>
        <Button type="submit" loading={loading}>
          {tc("save")}
        </Button>
      </div>
    </form>
  );
}
