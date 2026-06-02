"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Profil sayfasinda: hos geldin turunu sifirlar (onboardedAt = null) ve paneli
// yeniler; boylece tur modali tekrar gosterilir.
export function RestartTourButton() {
  const router = useRouter();
  const { update } = useSession();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/profile/onboarding", { method: "DELETE" });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? "İşlem başarısız, lütfen tekrar deneyin");
      return;
    }

    // Token'i tazele ki panel layout turu yeniden gostersin.
    await update({ onboarded: false });
    setLoading(false);

    toast.success("Tanıtım turu yeniden başlatıldı.");
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-gray-200 bg-white p-6">
      <h2 className="font-semibold text-gray-900">Tanıtım Turu</h2>
      <p className="text-sm text-gray-500">
        Çiftlik Pro’nun hoş geldin turunu istediğin zaman yeniden izleyebilirsin.
      </p>
      <Button variant="outline" onClick={handleClick} loading={loading}>
        <Sparkles className="h-4 w-4" />
        Turu Yeniden Başlat
      </Button>
    </div>
  );
}
