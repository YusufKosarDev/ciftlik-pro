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
import { roleLabels } from "@/lib/labels";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

// Her rolun panelde neler yapabilecegini ozetleyen, role ozel maddeler.
// (Kaynak: src/lib/authz.ts writePermissions matrisi.)
const roleHighlights: Record<Role, { icon: LucideIcon; text: string }[]> = {
  ADMIN: [
    { icon: ClipboardCheck, text: "Tüm modüllere tam erişim — kayıt ekle, düzenle, sil" },
    { icon: Users, text: "Personel yönet ve görev ata" },
    { icon: Coins, text: "Finans, denetim günlüğü ve raporlara eriş" },
  ],
  WORKER: [
    { icon: PawPrint, text: "Hayvan, süt ve ağırlık kayıtlarını gir" },
    { icon: Sprout, text: "Tarla ve ekim işlemlerini yönet" },
    { icon: Package, text: "Stok ve yem tüketimini takip et" },
  ],
  VET: [
    { icon: Stethoscope, text: "Sağlık kayıtları ve aşı takvimini yönet" },
    { icon: PawPrint, text: "Üreme/gebelik ve ağırlık kayıtlarını gir" },
    { icon: CalendarDays, text: "Yaklaşan aşıları takvimden izle" },
  ],
  ACCOUNTANT: [
    { icon: Coins, text: "Gelir-gider kayıtlarını ekle ve yönet" },
    { icon: ClipboardCheck, text: "Net bakiye ve aylık finans grafiklerini incele" },
    { icon: CalendarDays, text: "Görev ve takvimi takip et" },
  ],
};

const moduleCards: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: PawPrint, title: "Hayvanlar", desc: "Sağlık, aşı, süt, ağırlık ve soy" },
  { icon: Sprout, title: "Tarlalar", desc: "Ekim, hasat ve verim ekonomisi" },
  { icon: Package, title: "Stok & Yem", desc: "Kritik seviye uyarısı, tüketim" },
  { icon: Coins, title: "Finans", desc: "Gelir-gider ve aylık özet" },
];

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
  const [open, setOpen] = useState(true);
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const firstName = userName.trim().split(" ")[0] || userName;

  const steps: Step[] = [
    {
      icon: Wheat,
      title: "Çiftlik Pro'ya Hoş Geldin",
      body: (
        <div className="space-y-3 text-muted-foreground">
          <p className="text-lg font-medium text-foreground">Merhaba {firstName} 👋</p>
          <p>
            Çiftliğinin tüm operasyonlarını — hayvan, tarla, stok, finans ve
            görevleri — tek panelden yönet. Hadi sana hızlıca etrafı gösterelim.
          </p>
          <p className="text-sm text-muted-foreground">
            Bu tur yalnızca birkaç saniye sürer; istersen{" "}
            <span className="font-medium text-foreground">Geç</span>’e basabilirsin.
          </p>
        </div>
      ),
    },
    {
      icon: Package,
      title: "Ana Modüller",
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
      title: `${roleLabels[role]} olarak neler yapabilirsin?`,
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
      title: "Harita & Takvim",
      body: (
        <div className="space-y-4 text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <MapIcon className="h-4 w-4 text-green-700" aria-hidden />
            </span>
            <p>
              <span className="font-semibold text-foreground">2D Çiftlik Haritası</span>{" "}
              — tarlaları ve yapıları (ahır, kümes, depo) tek bakışta gör.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <CalendarDays className="h-4 w-4 text-green-700" aria-hidden />
            </span>
            <p>
              <span className="font-semibold text-foreground">Takvim</span> — aşı,
              görev, hasat ve doğumlar tek aylık görünümde toplanır.
            </p>
          </div>
        </div>
      ),
    },
    {
      icon: CheckCircle2,
      title: "Hazırsın! 🎉",
      body: (
        <div className="space-y-3 text-muted-foreground">
          <p>
            Artık başlamaya hazırsın. Panelden istediğin modüle geçebilir, üst
            menüden hızlıca gezinebilirsin.
          </p>
          <p className="text-sm text-muted-foreground">
            Bu turu istediğin zaman <span className="font-medium text-foreground">Profil</span>{" "}
            sayfasından yeniden başlatabilirsin.
          </p>
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
            aria-label="Turu kapat"
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
                Adım {step + 1} / {steps.length}
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
                aria-label={`Adım ${i + 1}`}
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
                Geri
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
                Geç
              </Button>
            )}
            {isLast ? (
              <Button size="sm" onClick={finish} loading={saving}>
                Başla
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setStep((s) => s + 1)} disabled={saving}>
                İleri
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
