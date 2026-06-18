"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { userRoles } from "@/lib/validations/auth";
import { roleLabels } from "@/lib/labels";

// ADMIN personel daveti olusturma formu. Basariliysa kabul baglantisini gosterir
// (e-posta yapilandirilmamis olsa bile admin linki paylasabilsin).
export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<string>("WORKER");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setAcceptUrl(null);
    setLoading(true);

    const res = await fetch("/api/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    setLoading(false);
    const j = (await res.json().catch(() => ({}))) as { error?: string; acceptUrl?: string };
    if (!res.ok) {
      setError(j.error ?? "Davet oluşturulamadı.");
      return;
    }
    setAcceptUrl(j.acceptUrl ?? null);
    setEmail("");
    router.refresh();
  }

  async function copyLink() {
    if (!acceptUrl) return;
    await navigator.clipboard.writeText(acceptUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 font-semibold text-foreground">Personel davet et</h3>
      <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
        <div className="min-w-56 flex-1">
          <Label htmlFor="invite-email">E-posta</Label>
          <Input
            id="invite-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="personel@ciftlik.com"
          />
        </div>
        <div>
          <Label htmlFor="invite-role">Rol</Label>
          <select
            id="invite-role"
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
          >
            {userRoles.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" loading={loading} size="sm">
          Davet gönder
        </Button>
      </form>

      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>}

      {acceptUrl && (
        <div className="mt-3 rounded-lg bg-green-50 dark:bg-green-500/10 p-3">
          <p className="text-sm text-green-800 dark:text-green-300">
            Davet oluşturuldu. Bağlantıyı paylaşın (e-posta yapılandırıldıysa otomatik gönderildi):
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1 text-xs text-foreground">
              {acceptUrl}
            </code>
            <Button type="button" variant="outline" size="sm" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Kopyalandı" : "Kopyala"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
