"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

// Plan yükseltme/düşürme aksiyonları. Demo modunda (stripeEnabled=false) plan
// doğrudan değişir; gerçek Stripe'ta Checkout'a yönlendirir.
export function BillingActions({
  plan,
  stripeEnabled,
}: {
  plan: "FREE" | "PRO";
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function upgrade() {
    setLoading(true);
    const res = await fetch("/api/billing/checkout", { method: "POST" });
    const j = (await res.json().catch(() => ({}))) as { checkoutUrl?: string; error?: string };
    if (!res.ok) {
      setLoading(false);
      toast.error(j.error ?? "İşlem başarısız");
      return;
    }
    if (j.checkoutUrl) {
      window.location.href = j.checkoutUrl;
      return;
    }
    setLoading(false);
    toast.success("PRO'ya yükseltildi");
    router.refresh();
  }

  async function downgrade() {
    setLoading(true);
    const res = await fetch("/api/billing/downgrade", { method: "POST" });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setLoading(false);
    if (!res.ok) {
      toast.error(j.error ?? "İşlem başarısız");
      return;
    }
    toast.success("FREE planına dönüldü");
    router.refresh();
  }

  if (plan === "FREE") {
    return (
      <Button type="button" onClick={upgrade} loading={loading}>
        <Sparkles className="h-4 w-4" /> PRO&apos;ya yükselt
      </Button>
    );
  }

  // PRO
  return stripeEnabled ? (
    <p className="text-sm text-muted-foreground">
      Aboneliğinizi Stripe müşteri portalından yönetebilirsiniz.
    </p>
  ) : (
    <Button type="button" variant="outline" onClick={downgrade} loading={loading}>
      Demo: FREE planına dön
    </Button>
  );
}
