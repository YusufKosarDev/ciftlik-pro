"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useLabels } from "@/lib/use-labels";
import type { Structure } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-foreground";

export function StructureForm({ structure }: { structure?: Structure }) {
  const t = useTranslations("Structures");
  const tc = useTranslations("Common");
  const { structureTypeLabels } = useLabels();
  const router = useRouter();
  const isEdit = Boolean(structure);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      name: String(fd.get("name")),
      type: String(fd.get("type")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(
      isEdit ? `/api/structures/${structure!.id}` : "/api/structures",
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

    toast.success(t("saved"));
    router.push("/panel/yapilar");
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
            {t("nameRequired")}
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder={t("namePlaceholder")}
            defaultValue={structure?.name ?? ""}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="type" className={labelClass}>
            {t("typeRequired")}
          </label>
          <select
            id="type"
            name="type"
            required
            defaultValue={structure?.type ?? "BARN"}
            className={inputClass}
          >
            {Object.entries(structureTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="notes" className={labelClass}>
          {tc("notes")}
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={structure?.notes ?? ""}
          className={inputClass}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("positionHint")}
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href="/panel/yapilar"
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
