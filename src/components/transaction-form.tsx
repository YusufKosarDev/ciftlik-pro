"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { transactionTypeLabels } from "@/lib/labels";
import type { Transaction } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

// Date'i input[type=date] icin "YYYY-MM-DD" formatina cevirir.
function toDateInput(date: Date | null): string {
  if (!date) return "";
  return new Date(date).toISOString().slice(0, 10);
}

export function TransactionForm({ transaction }: { transaction?: Transaction }) {
  const router = useRouter();
  const isEdit = Boolean(transaction);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      setError(data?.error ?? "Kayit basarisiz, lutfen tekrar deneyin");
      return;
    }

    toast.success("İşlem kaydedildi.");
    router.push("/panel/finans");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className={labelClass}>
            Tur *
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
            Tutar (TL) *
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
            Kategori *
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
            Tarih *
          </label>
          <input
            id="date"
            name="date"
            type="date"
            required
            defaultValue={toDateInput(transaction?.date ?? null)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Aciklama
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
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/finans"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Iptal
        </Link>
        <Button type="submit" loading={loading}>
          Kaydet
        </Button>
      </div>
    </form>
  );
}
