"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { toDateInputValue } from "@/lib/date";
import type { Sale } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function SaleForm({
  sale,
  customers,
}: {
  sale?: Sale;
  customers: { id: string; name: string }[];
}) {
  const t = useTranslations("Sales");
  const tc = useTranslations("Common");
  const router = useRouter();
  const isEdit = Boolean(sale);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      item: String(fd.get("item")),
      customerId: String(fd.get("customerId")),
      quantity: String(fd.get("quantity")),
      unit: String(fd.get("unit")),
      amount: String(fd.get("amount")),
      date: String(fd.get("date")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(isEdit ? `/api/sales/${sale!.id}` : "/api/sales", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Kayit basarisiz, lutfen tekrar deneyin");
      return;
    }

    toast.success(t("saved"));
    router.push("/panel/satis");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="item" className={labelClass}>
            {t("itemLabel")}
          </label>
          <input
            id="item"
            name="item"
            type="text"
            required
            placeholder={t("itemPlaceholder")}
            defaultValue={sale?.item ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="customerId" className={labelClass}>
            {t("customer")}
          </label>
          <select
            id="customerId"
            name="customerId"
            defaultValue={sale?.customerId ?? ""}
            className={inputClass}
          >
            <option value="">— (yok)</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className={labelClass}>
            {t("amountLabel")}
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={sale?.amount ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="quantity" className={labelClass}>
            {tc("quantity")}
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="0.01"
            min="0"
            defaultValue={sale?.quantity ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="unit" className={labelClass}>
            {t("unit")}
          </label>
          <input
            id="unit"
            name="unit"
            type="text"
            placeholder={t("unitPlaceholder")}
            defaultValue={sale?.unit ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            {t("dateLabel")}
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={toDateInputValue(sale?.date)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          {tc("note")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={sale?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("autoIncomeHint")}
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/satis"
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
