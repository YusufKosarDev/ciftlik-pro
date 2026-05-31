"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { breedingStatusLabels } from "@/lib/labels";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";

export function BreedingForm({ animalId }: { animalId: string }) {
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
      sireTag: String(fd.get("sireTag")),
      breedingDate: String(fd.get("breedingDate")),
      expectedBirthDate: String(fd.get("expectedBirthDate")),
      actualBirthDate: String(fd.get("actualBirthDate")),
      status: String(fd.get("status")),
      offspringCount: String(fd.get("offspringCount")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch(`/api/animals/${animalId}/breeding`, {
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

    toast.success("Üreme kaydı eklendi.");
    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg bg-gray-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="bdate" className="mb-1 block text-xs font-medium text-gray-600">
            Tohumlama Tarihi *
          </label>
          <input id="bdate" name="breedingDate" type="date" required className={inputClass} />
        </div>
        <div>
          <label htmlFor="bsire" className="mb-1 block text-xs font-medium text-gray-600">
            Baba Kulak No
          </label>
          <input id="bsire" name="sireTag" type="text" className={inputClass} />
        </div>
        <div>
          <label htmlFor="bexp" className="mb-1 block text-xs font-medium text-gray-600">
            Tahmini Doğum Tarihi
          </label>
          <input id="bexp" name="expectedBirthDate" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="bact" className="mb-1 block text-xs font-medium text-gray-600">
            Gerçek Doğum Tarihi
          </label>
          <input id="bact" name="actualBirthDate" type="date" className={inputClass} />
        </div>
        <div>
          <label htmlFor="bstatus" className="mb-1 block text-xs font-medium text-gray-600">
            Durum
          </label>
          <select id="bstatus" name="status" defaultValue="PLANNED" className={inputClass}>
            {Object.entries(breedingStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="bcount" className="mb-1 block text-xs font-medium text-gray-600">
            Yavru Sayısı
          </label>
          <input id="bcount" name="offspringCount" type="number" min="0" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="bnotes" className="mb-1 block text-xs font-medium text-gray-600">
            Not
          </label>
          <input id="bnotes" name="notes" type="text" className={inputClass} />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <Button type="submit" loading={loading}>
        Üreme Kaydı Ekle
      </Button>
    </form>
  );
}
