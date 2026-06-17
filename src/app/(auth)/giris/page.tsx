"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Wheat, Mail, Lock, Sprout, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function GirisPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("E-posta veya parola hatalı");
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  // Ziyaretçiler için: kayıt gerektirmeyen demo (WORKER) hesabıyla giriş.
  async function handleDemo() {
    setError(null);
    setDemoLoading(true);
    const result = await signIn("credentials", {
      email: "demo@ciftlik.com",
      password: "demo1234",
      redirect: false,
    });
    setDemoLoading(false);
    if (result?.error) {
      setError("Demo girişi şu an kullanılamıyor");
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Wheat className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Çiftlik Pro</h1>
          <p className="mt-1 text-sm text-muted-foreground">Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">E-posta</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="ornek@ciftlik.com"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">Parola</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="pl-9"
              />
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Giriş Yap
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-muted" />
          veya
          <span className="h-px flex-1 bg-muted" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleDemo}
          loading={demoLoading}
          className="w-full"
        >
          <Sprout className="h-4 w-4" />
          Demo olarak gez
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Kayıt gerektirmez · örnek verilerle inceleyin
        </p>
      </div>
    </main>
  );
}
