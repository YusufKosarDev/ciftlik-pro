"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteAnimalButton({
  id,
  label,
}: {
  id: string;
  label: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `"${label}" kaydini silmek istediginize emin misiniz?`
    );
    if (!confirmed) return;

    setLoading(true);
    const res = await fetch(`/api/animals/${id}`, { method: "DELETE" });
    setLoading(false);

    if (!res.ok) {
      window.alert("Silme islemi basarisiz oldu.");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-60"
    >
      {loading ? "Siliniyor..." : "Sil"}
    </button>
  );
}
