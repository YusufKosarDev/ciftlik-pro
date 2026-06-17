"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

export function HealthRecordForm({ animalId }: { animalId: string }) {
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
      diagnosis: String(fd.get("diagnosis")),
      treatment: String(fd.get("treatment")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(`/api/animals/${animalId}/health`, {
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

    toast.success("Sağlık kaydı eklendi.");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-muted p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="date" className="mb-1 block text-xs font-medium text-muted-foreground">
            Tarih *
          </label>
          <input id="date" name="date" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="diagnosis" className="mb-1 block text-xs font-medium text-muted-foreground">
            Teshis *
          </label>
          <input id="diagnosis" name="diagnosis" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="treatment" className="mb-1 block text-xs font-medium text-muted-foreground">
            Tedavi
          </label>
          <input id="treatment" name="treatment" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="notes" className="mb-1 block text-xs font-medium text-muted-foreground">
            Not
          </label>
          <input id="notes" name="notes" type="text" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading}>
        Sağlık Kaydı Ekle
      </Button>
    </form>
  );
}
