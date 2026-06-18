"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { Download, AlertTriangle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// ADMIN hesap islemleri: tum tenant verisini disa aktar (KVKK) ve cifligi kalici
// sil (hesap kapatma). Silme, ciftlik adi birebir yazilarak onaylanir.
export function AccountDangerZone({
  farmName,
  canDelete,
}: {
  farmName: string;
  canDelete: boolean;
}) {
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
      setError(j.error ?? "Çiftlik silinemedi.");
      return;
    }
    // Tüm veri silindi → oturumu kapat ve giriş ekranına dön.
    await signOut({ callbackUrl: "/giris" });
  }

  return (
    <div className="space-y-5 rounded-xl border border-red-300 dark:border-red-500/30 bg-card p-6">
      <h2 className="flex items-center gap-2 font-semibold text-red-700 dark:text-red-400">
        <AlertTriangle className="h-4 w-4" /> Tehlikeli bölge
      </h2>

      {/* Veri dışa aktarma (KVKK taşınabilirlik) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-5">
        <div>
          <p className="text-sm font-medium text-foreground">Verilerini dışa aktar</p>
          <p className="text-sm text-muted-foreground">
            Çiftliğinin tüm kayıtlarını JSON olarak indir.
          </p>
        </div>
        <a href="/api/tenant/export" download className={buttonVariants({ variant: "outline", size: "sm" })}>
          <Download className="h-4 w-4" /> Dışa aktar
        </a>
      </div>

      {/* Çiftliği kalıcı silme */}
      {canDelete ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Çiftliği kalıcı sil</p>
            <p className="text-sm text-muted-foreground">
              Tüm veriler ve kullanıcılar geri alınamaz şekilde silinir. Onaylamak için
              çiftlik adını yazın: <span className="font-semibold text-foreground">{farmName}</span>
            </p>
          </div>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={farmName}
            aria-label="Onay için çiftlik adı"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <Button
            type="button"
            onClick={handleDelete}
            disabled={confirm !== farmName}
            loading={loading}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Çiftliği kalıcı sil
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Demo çiftliği silinemez.
        </p>
      )}
    </div>
  );
}
