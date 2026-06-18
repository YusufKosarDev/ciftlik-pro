"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Davet kabul formu: e-posta sabit (davette belirlenmis), davetli adini +
// parolasini girer. Basariliysa otomatik giris yapar.
export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name"));
    const password = String(fd.get("password"));

    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });

    if (!res.ok) {
      setLoading(false);
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error ?? "Katılım başarısız. Lütfen tekrar deneyin.");
      return;
    }

    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      router.push("/giris");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">E-posta</Label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="email" value={email} readOnly disabled className="pl-9" />
        </div>
      </div>

      <div>
        <Label htmlFor="name">Ad Soyad</Label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="name" name="name" required maxLength={60} autoComplete="name" placeholder="Ad Soyad" className="pl-9" />
        </div>
      </div>

      <div>
        <Label htmlFor="password">Parola</Label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input id="password" name="password" type="password" required minLength={8} maxLength={72} autoComplete="new-password" placeholder="••••••••" className="pl-9" />
        </div>
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} className="w-full">
        Katıl ve giriş yap
      </Button>
    </form>
  );
}
