"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

export function VaccinationForm({ animalId }: { animalId: string }) {
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
      name: String(fd.get("name")),
      date: String(fd.get("date")),
      nextDate: String(fd.get("nextDate")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(`/api/animals/${animalId}/vaccinations`, {
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

    toast.success("Aşı kaydı eklendi.");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="vname" className="mb-1 block text-xs font-medium text-gray-600">
            Asi Adi *
          </label>
          <input id="vname" name="name" type="text" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="vdate" className="mb-1 block text-xs font-medium text-gray-600">
            Yapilis Tarihi *
          </label>
          <input id="vdate" name="date" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="vnext" className="mb-1 block text-xs font-medium text-gray-600">
            Sonraki Asi Tarihi
          </label>
          <input id="vnext" name="nextDate" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="vnotes" className="mb-1 block text-xs font-medium text-gray-600">
            Not
          </label>
          <input id="vnotes" name="notes" type="text" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading}>
        Aşı Kaydı Ekle
      </Button>
    </form>
  );
}
