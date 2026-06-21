"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";

// Profil sayfasinda: hos geldin turunu sifirlar (onboardedAt = null) ve paneli
// yeniler; boylece tur modali tekrar gosterilir.
export function RestartTourButton() {
  const router = useRouter();
  const { update } = useSession();
  const t = useTranslations("Profile");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/profile/onboarding", { method: "DELETE" });

    if (!res.ok) {
      setLoading(false);
      const data = await res.json().catch(() => null);
      toast.error(data?.error ?? tc("saveFailed"));
      return;
    }

    // Token'i tazele ki panel layout turu yeniden gostersin.
    await update({ onboarded: false });
    setLoading(false);

    toast.success(t("tourRestarted"));
    router.push("/panel");
    router.refresh();
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold text-foreground">{t("tourTitle")}</h2>
      <p className="text-sm text-muted-foreground">
        {t("tourDesc")}
      </p>
      <Button variant="outline" onClick={handleClick} loading={loading}>
        <Sparkles className="h-4 w-4" />
        {t("restartTour")}
      </Button>
    </div>
  );
}
