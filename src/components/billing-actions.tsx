"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Plan yükseltme/düşürme aksiyonları. Demo modunda (stripeEnabled=false) plan
// doğrudan değişir; gerçek Stripe'ta Checkout'a yönlendirir.
export function BillingActions({
  plan,
  stripeEnabled,
  isDemo = false,
}: {
  plan: "FREE" | "PRO";
  stripeEnabled: boolean;
  isDemo?: boolean;
}) {
  const t = useTranslations("Billing");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Demo modunda plan degisikligi salt-okunur (sunucu da engeller). Ozelligi
  // gosterir ama gercek aksiyonu devre disi birakir.
  if (isDemo) {
    return (
      <div className="text-right">
        <Button type="button" disabled>
          <Sparkles className="h-4 w-4" />
          {plan === "FREE" ? t("upgradeCta") : t("changePlan")}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">{t("demoDisabled")}</p>
      </div>
    );
  }

  async function upgrade() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const j = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
    if (!res.ok) {
      setLoading(false);
      toast.error(j.error ?? t("actionFailed"));
      return;
    }
    if (j.checkoutUrl) {
      window.location.href = j.checkoutUrl;
      return;
    }
    setLoading(false);
    toast.success(t("upgraded"));
    router.refresh();
  }

  async function downgrade() {
    setLoading(true);
    const res = await fetch("/api/billing/downgrade", { method: "POST" });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      toast.error(j.error ?? t("actionFailed"));
      return;
    }
    toast.success(t("downgraded"));
    router.refresh();
  }

  if (plan === "FREE") {
    return (
      <Button type="button" onClick={upgrade} loading={loading}>
        <Sparkles className="h-4 w-4" /> {t("upgradeCta")}
      </Button>
    );
  }

  // PRO
  return stripeEnabled ? (
    <p className="text-sm text-muted-foreground">
      {t("stripePortalHint")}
    </p>
  ) : (
    <Button type="button" variant="outline" onClick={downgrade} loading={loading}>
      {t("demoDowngrade")}
    </Button>
  );
}
