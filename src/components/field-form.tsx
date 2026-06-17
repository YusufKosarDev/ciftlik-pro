"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Field } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function FieldForm({ field }: { field?: Field }) {
  const router = useRouter();
  const isEdit = Boolean(field);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      area: String(fd.get("area")),
      location: String(fd.get("location")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(
      isEdit ? `/api/fields/${field!.id}` : "/api/fields",
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

    toast.success("Tarla kaydedildi.");
    router.push("/panel/tarlalar");
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
            Tarla Adi *
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={field?.name ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="area" className={labelClass}>
            Alan (donum) *
          </label>
          <input
            id="area"
            name="area"
            type="number"
            step="0.1"
            min="0"
            required
            defaultValue={field?.area ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="location" className={labelClass}>
            Konum / Mevki
          </label>
          <input
            id="location"
            name="location"
            type="text"
            defaultValue={field?.location ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          Notlar
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={field?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/tarlalar"
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
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
