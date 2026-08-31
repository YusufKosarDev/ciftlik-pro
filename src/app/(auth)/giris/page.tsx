"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Wheat,
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Crown,
  HardHat,
  Stethoscope,
  Calculator,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  DEMO_ACCOUNTS,
  DEMO_PASSWORD,
  type DemoAccount,
} from "@/lib/demo-accounts";

// NEDEN ROL SECICI: Projenin manset iddiasi "4 rollu RBAC". Tek bir ADMIN
// hesabiyla ziyaretci butun modulleri gorup "her sey acik" izlenimi aliyordu;
// yani iddianin kaniti demoda GORUNMUYORDU. Her rolun ne goremedigini dugmenin
// uzerinde yazmak da sart: aksi halde WORKER ile giren biri eksik menuyu
// "site bozuk" diye okur.
//
// Hesaplarin kendisi src/lib/demo-accounts.ts'te (TEK KAYNAK). Ikonlar burada
// kaliyor: o modul bilincli olarak hicbir sey import etmiyor, lucide dahil.
const ROLE_ICONS: Record<DemoAccount["i18nKey"], LucideIcon> = {
  Admin: Crown,
  Worker: HardHat,
  Vet: Stethoscope,
  Accountant: Calculator,
};

export default function GirisPage() {
  const router = useRouter();
  const t = useTranslations("Login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Hangi rolun girisi surdugu; null ise hicbiri.
  const [demoLoading, setDemoLoading] = useState<string | null>(null);

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
      setError(t("errorInvalid"));
      return;
    }

    router.push("/panel");
    router.refresh();
  }

  // Ziyaretçiler için: kayıt gerektirmeyen, salt-okunur demo girişi. Seçilen
  // role göre farklı hesap kullanılır; hepsi aynı çiftliğin verisini görür,
  // hiçbiri yazma yapamaz (src/lib/authz.ts isDemoUser).
  async function handleDemo(email: string) {
    setError(null);
    setDemoLoading(email);
    const result = await signIn("credentials", {
      email,
      password: DEMO_PASSWORD,
      redirect: false,
    });
    setDemoLoading(null);
    if (result?.error) {
      setError(t("errorDemo"));
      return;
    }
    router.push("/panel");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-700 via-green-600 to-emerald-800 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-xl">
        <div className="mb-4 flex justify-end">
          <LanguageSwitcher />
        </div>
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400">
            <Wheat className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">{t("email")}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t("emailPlaceholder")}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">{t("password")}</Label>
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
            <p className="flex items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {t("submit")}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-muted" />
          {t("or")}
          <span className="h-px flex-1 bg-muted" />
        </div>

        <p className="mb-2 text-center text-sm font-medium text-foreground">
          {t("demo")}
        </p>
        {/*
          Her dugmede rol adi + o rolun NE GOREMEDIGI yaziyor. Aciklama
          kozmetik degil: ziyaretci tiklamadan once ne bekleyecegini bilmezse,
          WORKER ile girip daralan menuyu bir arayuz hatasi sanir.
          `disabled` tum dugmelere uygulanir (cift gonderimi onler); yalnizca
          ikon spinner ile degisir, boylece yerlesim kaymaz.
        */}
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map(({ email, i18nKey }) => {
            const Icon = ROLE_ICONS[i18nKey];
            return (
              <Button
                key={email}
                type="button"
                variant="outline"
                onClick={() => handleDemo(email)}
                disabled={demoLoading !== null}
                className="h-auto flex-col items-start gap-0.5 px-3 py-2.5"
              >
                <span className="flex items-center gap-1.5 text-sm font-semibold">
                  {demoLoading === email ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                  ) : (
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  )}
                  {t(`demo${i18nKey}`)}
                </span>
                <span className="text-[11px] font-normal leading-tight text-muted-foreground">
                  {t(`demo${i18nKey}Note`)}
                </span>
              </Button>
            );
          })}
        </div>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {t("demoHint")}
        </p>

        <p className="mt-4 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link href="/kayit" className="font-medium text-green-700 dark:text-green-400 hover:underline">
            {t("signupLink")}
          </Link>
        </p>
      </div>
    </main>
  );
}
