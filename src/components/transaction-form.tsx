"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLabels } from "@/lib/use-labels";
import { toDateInputValue } from "@/lib/date";
import type { Transaction } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function TransactionForm({ transaction }: { transaction?: Transaction }) {
  const router = useRouter();
  const isEdit = Boolean(transaction);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const t = useTranslations("Finance");
  const tc = useTranslations("Common");
  const { transactionTypeLabels } = useLabels();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      type: String(fd.get("type")),
      amount: String(fd.get("amount")),
      category: String(fd.get("category")),
      date: String(fd.get("date")),
      description: String(fd.get("description")),
    };

    const res = await fetch(
      isEdit ? `/api/transactions/${transaction!.id}` : "/api/transactions",
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
    router.push("/panel/finans");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-card p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className={labelClass}>
            {t("type")} *
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={transaction?.type ?? "INCOME"}
            className={inputClass}
          >
            {Object.entries(transactionTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="amount" className={labelClass}>
            {t("amount")} (TL) *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={transaction?.amount ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="category" className={labelClass}>
            {t("category")} *
          </label>
          <input
            id="category"
            name="category"
            type="text"
            required
            placeholder="Sut satisi, Yem alimi..."
            defaultValue={transaction?.category ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="date" className={labelClass}>
            {t("date")} *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={toDateInputValue(transaction?.date)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          {t("description")}
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={transaction?.description ?? ""}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/finans"
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
