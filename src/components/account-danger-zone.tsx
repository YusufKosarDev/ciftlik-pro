"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Download, AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslations } from "next-intl";

// ADMIN account actions: export all of the tenant's data (GDPR/KVKK) and
// permanently delete the farm (account closure). Deletion is confirmed by typing
// the farm's name exactly.
export function AccountDangerZone({
  farmName,
  canDelete,
}: {
  farmName: string;
  canDelete: boolean;
}) {
  const t = useTranslations("Profile");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/tenant", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm }),
    });
    if (!res.ok) {
      setLoading(false);
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? t("deleteFailed"));
      return;
    }
    // All data is gone -> sign out and return to the sign-in screen.
    await signOut({ callbackUrl: "/giris" });
  }

  return (
    <div className="space-y-5 rounded-xl border border-red-300 dark:border-red-500/30 bg-card p-6">
      <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" /> {t("dangerZone")}
      </h2>

      {/* Data export (GDPR/KVKK portability) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-foreground">{t("exportData")}</p>
          <p className="text-sm text-muted-foreground">
            {t("exportDesc")}
          </p>
        </div>
        <a href="/api/tenant/export" download className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Download className="h-4 w-4" /> {t("exportBtn")}
        </a>
      </div>

      {/* Permanently delete the farm */}
      {canDelete ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">{t("deleteFarm")}</p>
            <p className="text-sm text-muted-foreground">
              {t("deleteConfirm")} <span className="font-semibold text-foreground">{farmName}</span>
            </p>
          </div>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={farmName}
            aria-label={t("deleteAria")}
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button
            type="button"
            onClick={handleDelete}
            disabled={confirm !== farmName}
            loading={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {t("deleteFarm")}
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("cannotDeleteDemo")}
        </p>
      )}
    </div>
  );
}
