"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { speciesLabels, genderLabels, statusLabels } from "@/lib/labels";

const inputClass =
  "w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500";
const labelClass = "mb-1 block text-sm font-medium text-gray-700";

export default function YeniHayvanPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      tagNumber: String(fd.get("tagNumber")),
      name: String(fd.get("name")),
      species: String(fd.get("species")),
      breed: String(fd.get("breed")),
      gender: String(fd.get("gender")),
      birthDate: String(fd.get("birthDate")),
      status: String(fd.get("status")),
      notes: String(fd.get("notes")),
    };

    const res = await fetch("/api/animals", {
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

    router.push("/panel/hayvanlar");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Yeni Hayvan</h1>
        <Link href="/panel/hayvanlar" className="text-sm text-gray-500 hover:underline">
          &larr; Listeye don
        </Link>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-gray-200 bg-white p-6"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="tagNumber" className={labelClass}>
              Kulak No *
            </label>
            <input id="tagNumber" name="tagNumber" type="text" required className={inputClass} />
          </div>

          <div>
            <label htmlFor="name" className={labelClass}>
              Ad
            </label>
            <input id="name" name="name" type="text" className={inputClass} />
          </div>

          <div>
            <label htmlFor="species" className={labelClass}>
              Tur *
            </label>
            <select id="species" name="species" required defaultValue="CATTLE" className={inputClass}>
              {Object.entries(speciesLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="breed" className={labelClass}>
              Cins / Irk
            </label>
            <input id="breed" name="breed" type="text" className={inputClass} />
          </div>

          <div>
            <label htmlFor="gender" className={labelClass}>
              Cinsiyet *
            </label>
            <select id="gender" name="gender" required defaultValue="FEMALE" className={inputClass}>
              {Object.entries(genderLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="birthDate" className={labelClass}>
              Dogum Tarihi
            </label>
            <input id="birthDate" name="birthDate" type="date" className={inputClass} />
          </div>

          <div>
            <label htmlFor="status" className={labelClass}>
              Durum
            </label>
            <select id="status" name="status" defaultValue="ACTIVE" className={inputClass}>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="notes" className={labelClass}>
            Notlar
          </label>
          <textarea id="notes" name="notes" rows={3} className={inputClass} />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <div className="flex justify-end gap-3">
          <Link
            href="/panel/hayvanlar"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Iptal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-60"
          >
            {loading ? "Kaydediliyor..." : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}
