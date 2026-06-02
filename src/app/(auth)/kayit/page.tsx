"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Wheat, Mail, Lock, User, UserCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleLabels } from "@/lib/labels";

export default function KayitPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get("name")).trim();
    const email = String(formData.get("email")).trim();
    const password = String(formData.get("password"));
    const role = String(formData.get("role"));

    // İstemci tarafı temel doğrulamaları
    if (name.length < 2) {
      setError("Ad en az 2 karakter olmalıdır");
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError("Parola en az 8 karakter olmalıdır");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Kayıt işlemi başarısız oldu");
        setLoading(false);
        return;
      }

      toast.success("Hesabınız oluşturuldu. Giriş yapabilirsiniz.");
      router.push("/giris");
    } catch {
      setError("Bir bağlantı hatası oluştu, lütfen tekrar deneyin");
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700">
            <Wheat className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Çiftlik Pro</h1>
          <p className="mt-1 text-sm text-gray-500">Yeni hesap oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Ad Soyad</Label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Ahmet Yılmaz"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">E-posta</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
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
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                required
                placeholder="En az 8 karakter"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="role">Rol</Label>
            <div className="relative">
              <UserCheck className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <select
                id="role"
                name="role"
                required
                defaultValue="ADMIN"
                className="flex h-10 w-full rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {Object.entries(roleLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            Kayıt Ol
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Zaten hesabınız var mı?{" "}
          <Link href="/giris" className="font-semibold text-green-700 hover:underline">
            Giriş Yap
          </Link>
        </div>
      </div>
    </main>
  );
}
