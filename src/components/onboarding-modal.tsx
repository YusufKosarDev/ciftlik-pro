"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { Role } from "@prisma/client";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  Map as MapIcon,
  Package,
  PawPrint,
  Sprout,
  Stethoscope,
  Users,
  Wheat,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLabels } from "@/lib/use-labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useTranslations } from "next-intl";

type Step = {
  icon: LucideIcon;
  title: string;
  body: React.ReactNode;
};

export function OnboardingModal({
  userName,
  role,
}: {
  userName: string;
  role: Role;
}) {
  const router = useRouter();
  const { update } = useSession();
  const t = useTranslations("Onboarding");
  const { roleLabels } = useLabels();
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const firstName = userName.trim().split(" ")[0] || userName;

  const roleHighlights: Record<Role, { icon: LucideIcon; text: string }[]> = {
    ADMIN: [
      { icon: ClipboardCheck, text: t("roles.ADMIN.0") },
      { icon: Users, text: t("roles.ADMIN.1") },
      { icon: Coins, text: t("roles.ADMIN.2") },
    ],
    WORKER: [
      { icon: PawPrint, text: t("roles.WORKER.0") },
      { icon: Sprout, text: t("roles.WORKER.1") },
      { icon: Package, text: t("roles.WORKER.2") },
    ],
    VET: [
      { icon: Stethoscope, text: t("roles.VET.0") },
      { icon: PawPrint, text: t("roles.VET.1") },
      { icon: CalendarDays, text: t("roles.VET.2") },
    ],
    ACCOUNTANT: [
      { icon: Coins, text: t("roles.ACCOUNTANT.0") },
      { icon: ClipboardCheck, text: t("roles.ACCOUNTANT.1") },
      { icon: CalendarDays, text: t("roles.ACCOUNTANT.2") },
    ],
  };

  const moduleCards: { icon: LucideIcon; title: string; desc: string }[] = [
    { icon: PawPrint, title: t("modules.animalsTitle"), desc: t("modules.animalsDesc") },
    { icon: Sprout, title: t("modules.fieldsTitle"), desc: t("modules.fieldsDesc") },
    { icon: Package, title: t("modules.inventoryTitle"), desc: t("modules.inventoryDesc") },
    { icon: Coins, title: t("modules.financeTitle"), desc: t("modules.financeDesc") },
  ];

  const steps: Step[] = [
    {
      icon: Wheat,
      title: t("welcomeTitle"),
      body: (
        <div className="space-y-3 text-muted-foreground">
          <p className="text-lg font-medium text-foreground">{t("welcomeGreeting", { name: firstName })}</p>
          <p>{t("welcomeDesc1")}</p>
          <p className="text-sm text-muted-foreground">
            {t("welcomeDesc2")}
          </p>
        </div>
      ),
    },
    {
      icon: Package,
      title: t("modulesTitle"),
      body: (
        <div className="grid grid-cols-2 gap-3">
          {moduleCards.map((m) => (
            <div
              key={m.title}
              className="flex flex-col gap-1.5 rounded-xl border border-border bg-muted/60 p-3"
            >
              <m.icon className="h-5 w-5 text-green-600" aria-hidden />
              <span className="font-semibold text-foreground">{m.title}</span>
              <span className="text-xs text-muted-foreground">{m.desc}</span>
            </div>
          ))}
        </div>
      ),
    },
    {
      icon: ClipboardCheck,
      title: t("roleTitle", { role: roleLabels[role] }),
      body: (
        <ul className="space-y-3">
          {roleHighlights[role].map((h, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
                <h.icon className="h-4 w-4 text-green-700" aria-hidden />
              </span>
              <span className="text-foreground">{h.text}</span>
            </li>
          ))}
        </ul>
      ),
    },
    {
      icon: MapIcon,
      title: t("mapTitle"),
      body: (
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <MapIcon className="h-4 w-4 text-green-700" aria-hidden />
            </span>
            <p>{t("mapDesc")}</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <CalendarDays className="h-4 w-4 text-green-700" aria-hidden />
            </span>
            <p>{t("calendarDesc")}</p>
          </div>
        </div>
      ),
    },
    {
      icon: CheckCircle2,
      title: t("readyTitle"),
      body: (
        <div className="space-y-3 text-muted-foreground">
          <p>{t("readyDesc1")}</p>
          <p className="text-sm text-muted-foreground">{t("readyDesc2")}</p>
        </div>
      ),
    },
  ];

  const isLast = step === steps.length - 1;
  const current = steps[step];

  // Turu kapat: sunucuya tamamlandi bilgisini gonderir (best-effort) ve modali kapatir.
  const finish = useCallback(async () => {
    setSaving(true);
    try {
      await fetch("/api/profile/onboarding", { method: "POST" });
      // Oturum token'indaki onboarding durumunu tazele (ekstra DB sorgusu olmadan
      // panel layout artik modali gostermez).
      await update({ onboarded: true });
    } catch {
      // Sessizce gec: tur tekrar gosterilse de kullaniciyi engellemeyelim.
    }
    setOpen(false);
    router.refresh();
  }, [router, update]);

  // Esc ile kapatma + arka plan kaydirmayi engelleme.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") finish();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, finish]);

  if (!open) return null;

  return (
    <div
      className="onboarding-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="onboarding-panel w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl">
        {/* Markali baslik */}
        <div className="relative bg-gradient-to-br from-green-600 to-emerald-500 px-6 py-7 text-white">
          <button
            type="button"
            onClick={finish}
            aria-label={t("close")}
            className="absolute right-4 top-4 rounded-lg p-1 text-white/80 transition hover:bg-card/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-card/20">
              <current.icon className="h-6 w-6" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                {t("step", { step: step + 1, total: steps.length })}
              </p>
              <h2 id="onboarding-title" className="text-xl font-bold leading-tight">
                {current.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Adim icerigi */}
        <div className="px-6 py-6">
          <div key={step} className="onboarding-step min-h-[150px]">
            {current.body}
          </div>
        </div>

        {/* Alt cubuk: ilerleme + gezinme */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("stepAria", { step: i + 1 })}
                aria-current={i === step}
                onClick={() => setStep(i)}
                className={cn(
                  "h-2 rounded-full transition-all",
                  i === step ? "w-6 bg-green-600" : "w-2 bg-muted-foreground/40 hover:bg-muted-foreground/70"
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStep((s) => s - 1)}
                disabled={saving}
              >
                <ArrowLeft className="h-4 w-4" />
                {t("back")}
              </Button>
            )}
            {!isLast && (
              <Button
                variant="ghost"
                size="sm"
                onClick={finish}
                disabled={saving}
                className="text-muted-foreground"
              >
                {t("skip")}
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish} loading={saving}>
                {t("start")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={saving}>
                {t("next")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
