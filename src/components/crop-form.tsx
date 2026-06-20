"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useLabels } from "@/lib/use-labels";
import { toDateInputValue } from "@/lib/date";
import type { Crop } from "@prisma/client";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

type Props = {
  fieldId: string;
  // Duzenleme modunda mevcut ekim kaydi; ekleme modunda undefined.
  crop?: Crop;
};

export function CropForm({ fieldId, crop }: Props) {
  const router = useRouter();
  const t = useTranslations("Crops");
  const tc = useTranslations("Common");
  const { cropStatusLabels } = useLabels();
  const isEdit = Boolean(crop);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload = {
      name: String(fd.get("name")),
      plantedDate: String(fd.get("plantedDate")),
      harvestDate: String(fd.get("harvestDate")),
      status: String(fd.get("status")),
      cost: String(fd.get("cost")),
      revenue: String(fd.get("revenue")),
      yieldAmount: String(fd.get("yieldAmount")),
      notes: String(fd.get("notes")),
    };

    const endpoint = isEdit
      ? `/api/fields/${fieldId}/crops/${crop!.id}`
      : `/api/fields/${fieldId}/crops`;

    const res = await fetch(endpoint, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? tc("saveFailed"));
      return;
    }

    toast.success(isEdit ? t("updated") : t("added"));
    if (!isEdit) form.reset();
    router.push(`/panel/tarlalar/${fieldId}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-muted p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cname" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("name")} *
          </label>
          <input
            id="cname"
            name="name"
            type="text"
            required
            defaultValue={crop?.name ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cstatus" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("status")}
          </label>
          <select
            id="cstatus"
            name="status"
            defaultValue={crop?.status ?? "PLANTED"}
            className={inputClass}
          >
            {Object.entries(cropStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cplanted" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("plantedDate")} *
          </label>
          <input
            id="cplanted"
            name="plantedDate"
            type="date"
            required
            defaultValue={toDateInputValue(crop?.plantedDate)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="charvest" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("harvestDate")}
          </label>
          <input
            id="charvest"
            name="harvestDate"
            type="date"
            defaultValue={toDateInputValue(crop?.harvestDate)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="ccost" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("cost")}
          </label>
          <input
            id="ccost"
            name="cost"
            type="number"
            step="0.01"
            min="0"
            defaultValue={crop?.cost ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="crev" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("revenue")}
          </label>
          <input
            id="crev"
            name="revenue"
            type="number"
            step="0.01"
            min="0"
            defaultValue={crop?.revenue ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="cyield" className="mb-1 block text-xs font-medium text-muted-foreground">
            {t("yieldAmount")}
          </label>
          <input
            id="cyield"
            name="yieldAmount"
            type="number"
            step="0.1"
            min="0"
            defaultValue={crop?.yieldAmount ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="cnotes" className="mb-1 block text-xs font-medium text-muted-foreground">
          {t("note")}
        </label>
        <input
          id="cnotes"
          name="notes"
          type="text"
          defaultValue={crop?.notes ?? ""}
          className={inputClass}
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Button type="submit" loading={loading}>
        {isEdit ? t("submitUpdate") : t("submitAdd")}
      </Button>
    </form>
  );
}
