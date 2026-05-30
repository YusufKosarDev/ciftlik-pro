"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

export function MilkYieldForm({ animalId }: { animalId: string }) {
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
      date: String(fd.get("date")),
      amount: String(fd.get("amount")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(`/api/animals/${animalId}/milk`, {
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

    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="mdate" className="mb-1 block text-xs font-medium text-gray-600">
            Tarih *
          </label>
          <input id="mdate" name="date" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="mamount" className="mb-1 block text-xs font-medium text-gray-600">
            Miktar (litre) *
          </label>
          <input
            id="mamount"
            name="amount"
            type="number"
            step="0.1"
            min="0"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="mnotes" className="mb-1 block text-xs font-medium text-gray-600">
            Not
          </label>
          <input id="mnotes" name="notes" type="text" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
      >
        {loading ? "Ekleniyor..." : "Sut Verimi Ekle"}
      </button>
    </form>
  );
}
