"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PawPrint, Wheat, Wallet, ListChecks, TrendingUp, TrendingDown, Minus, Settings2 } from "lucide-react";
import { cn } from "@/lib/cn";

type DeltaTone = "up" | "down" | "neutral";

type DeltaProp = {
  label: string;
  tone: DeltaTone;
} | null;

const statTones = {
  green: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400",
  sky: "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-400",
} as const;

const deltaToneClass = {
  up: "text-green-600 dark:text-green-400",
  down: "text-red-600 dark:text-red-400",
  neutral: "text-muted-foreground",
} as const;

const deltaIcon = {
  up: TrendingUp,
  down: TrendingDown,
  neutral: Minus,
} as const;

function StatCard({
  href,
  label,
  value,
  Icon,
  tone = "green",
  valueClass = "text-foreground",
  delta,
}: {
  href: string;
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof statTones;
  valueClass?: string;
  delta?: DeltaProp;
}) {
  const DeltaIcon = delta ? deltaIcon[delta.tone] : null;
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-border hover:shadow-md"
    >
      <span
        className={cn(
          "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition group-hover:scale-105",
          statTones[tone]
        )}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-muted-foreground truncate">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold tabular-nums truncate ${valueClass}`}>{value}</p>
        {delta && DeltaIcon && (
          <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium truncate", deltaToneClass[delta.tone])}>
            <DeltaIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{delta.label}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

export function DashboardCards({
  animalCount,
  animalsDelta,
  fieldCount,
  fieldsDelta,
  balance,
  balanceFormatted,
  balanceDelta,
  pendingTasks,
  tasksDelta,
  labels,
}: {
  animalCount: number;
  animalsDelta: DeltaProp;
  fieldCount: number;
  fieldsDelta: DeltaProp;
  balance: number;
  balanceFormatted: string;
  balanceDelta: DeltaProp;
  pendingTasks: number;
  tasksDelta: DeltaProp;
  labels: {
    activeAnimals: string;
    fields: string;
    netBalance: string;
    openTasks: string;
  };
}) {
  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>({
    animals: true,
    fields: true,
    balance: true,
    tasks: true,
  });
  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("dashboard_widgets");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setTimeout(() => {
          setVisibleWidgets(parsed);
        }, 0);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const toggleWidget = (key: string) => {
    setVisibleWidgets((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem("dashboard_widgets", JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-4">
      {/* Widget Özelleştirme Butonu */}
      <div className="flex justify-end relative">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted cursor-pointer transition shadow-sm"
        >
          <Settings2 className="h-3.5 w-3.5" /> Görünümü Özelleştir
        </button>

        {showConfig && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowConfig(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-border bg-card p-2 shadow-lg animate-in fade-in slide-in-from-top-1 duration-150">
              <p className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-b border-border pb-1">Görünür Kartlar</p>
              <div className="space-y-1 mt-1.5">
                {[
                  { key: "animals", label: labels.activeAnimals },
                  { key: "fields", label: labels.fields },
                  { key: "balance", label: labels.netBalance },
                  { key: "tasks", label: labels.openTasks },
                ].map((w) => (
                  <label
                    key={w.key}
                    className="flex items-center gap-2 text-xs font-medium cursor-pointer text-foreground hover:bg-muted p-1 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={visibleWidgets[w.key] !== false}
                      onChange={() => toggleWidget(w.key)}
                      className="rounded border-border text-green-600 focus:ring-green-500 h-3.5 w-3.5"
                    />
                    {w.label}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Özet kartları */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visibleWidgets.animals !== false && (
          <StatCard
            href="/panel/hayvanlar"
            label={labels.activeAnimals}
            value={String(animalCount)}
            Icon={PawPrint}
            tone="green"
            delta={animalsDelta}
          />
        )}
        {visibleWidgets.fields !== false && (
          <StatCard
            href="/panel/tarlalar"
            label={labels.fields}
            value={String(fieldCount)}
            Icon={Wheat}
            tone="amber"
            delta={fieldsDelta}
          />
        )}
        {visibleWidgets.balance !== false && (
          <StatCard
            href="/panel/finans"
            label={labels.netBalance}
            value={balanceFormatted}
            Icon={Wallet}
            tone="sky"
            valueClass={balance >= 0 ? "text-green-600" : "text-red-600"}
            delta={balanceDelta}
          />
        )}
        {visibleWidgets.tasks !== false && (
          <StatCard
            href="/panel/gorevler"
            label={labels.openTasks}
            value={String(pendingTasks)}
            Icon={ListChecks}
            tone="violet"
            delta={tasksDelta}
          />
        )}
      </div>
    </div>
  );
}
