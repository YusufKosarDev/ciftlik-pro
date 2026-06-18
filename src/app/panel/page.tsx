import Link from "next/link";
import { PawPrint, Wheat, Wallet, ListChecks, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { auth } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-prisma";
import { buildMonthlyFinance } from "@/lib/finance";
import { MonthlyFinanceChart } from "@/components/monthly-finance-chart";
import { getTranslations } from "next-intl/server";
import { countDelta, moneyDelta, overdueDelta, type StatDelta } from "@/lib/stat-delta";
import { cn } from "@/lib/cn";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR");
}

// Ozet kart bileseni
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
  delta?: StatDelta;
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
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-0.5 text-2xl font-bold tabular-nums ${valueClass}`}>{value}</p>
        {delta && DeltaIcon && (
          <p className={cn("mt-1 flex items-center gap-1 text-xs font-medium", deltaToneClass[delta.tone])}>
            <DeltaIcon className="h-3.5 w-3.5" />
            {delta.label}
          </p>
        )}
      </div>
    </Link>
  );
}

// Uyari kutusu bileseni
function AlertCard({
  title,
  icon,
  emptyText,
  children,
  hasItems,
}: {
  title: string;
  icon: string;
  emptyText: string;
  children: React.ReactNode;
  hasItems: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold text-foreground">
        <span>{icon}</span>
        {title}
      </h3>
      {hasItems ? (
        <ul className="space-y-2 text-sm">{children}</ul>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyText}</p>
      )}
    </div>
  );
}

export default async function PanelPage() {
  const session = await auth();
  const t = await getTranslations("Dashboard");
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  // Grafik yalnizca son 6 ayi gosterir; bu yuzden tum islemleri degil,
  // sadece bu pencereyi cekiyoruz. Toplamlar ise aggregate ile hesaplanir.
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  // Bu ayin baslangici — "bu ay" trend deltalari icin.
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Tum ozet verilerini tek seferde paralel cekiyoruz
  const [
    animalCount,
    fieldCount,
    totalsByType,
    recentTransactions,
    pendingTasks,
    inventoryItems,
    overdueTasks,
    upcomingVaccinations,
    animalsThisMonth,
    fieldsThisMonth,
    monthTotalsByType,
  ] = await withTenant(session!.user.tenantId, (db) =>
    Promise.all([
      db.animal.count({ where: { status: "ACTIVE" } }),
      db.field.count(),
      // Tum zamanlarin gelir/gider toplamlari (kayitlari belleğe cekmeden)
      db.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
      // Grafik icin yalnizca son 6 ayin islemleri
      db.transaction.findMany({
        where: { date: { gte: sixMonthsAgo } },
        select: { type: true, amount: true, date: true },
      }),
      db.task.count({ where: { status: { not: "DONE" } } }),
      db.inventoryItem.findMany(),
      db.task.findMany({
        where: { status: { not: "DONE" }, dueDate: { lt: now } },
        include: { assignedTo: { select: { name: true } } },
        orderBy: { dueDate: "asc" },
      }),
      db.vaccination.findMany({
        where: { nextDate: { gte: now, lte: in30Days } },
        include: { animal: { select: { tagNumber: true, name: true } } },
        orderBy: { nextDate: "asc" },
      }),
      // Trend deltalari: bu ay eklenen hayvan/tarla ve bu ayin gelir/gider toplami
      db.animal.count({ where: { createdAt: { gte: monthStart } } }),
      db.field.count({ where: { createdAt: { gte: monthStart } } }),
      db.transaction.groupBy({
        by: ["type"],
        _sum: { amount: true },
        where: { date: { gte: monthStart } },
      }),
    ])
  );

  const totalIncome =
    totalsByType.find((t) => t.type === "INCOME")?._sum.amount ?? 0;
  const totalExpense =
    totalsByType.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0;
  const balance = totalIncome - totalExpense;

  // Bu ayin net tutari (gelir - gider) — Net Bakiye kartinin deltasi.
  const monthIncome =
    monthTotalsByType.find((t) => t.type === "INCOME")?._sum.amount ?? 0;
  const monthExpense =
    monthTotalsByType.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0;
  const monthNet = monthIncome - monthExpense;

  const criticalItems = inventoryItems.filter(
    (i) => i.quantity <= i.criticalLevel
  );

  const monthlyFinance = buildMonthlyFinance(recentTransactions);

  const hasAlerts =
    criticalItems.length > 0 ||
    overdueTasks.length > 0 ||
    upcomingVaccinations.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("welcome", { name: session?.user.name ?? "" })}
        </p>
      </div>

      {/* Ozet kartlari */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/panel/hayvanlar"
          label={t("activeAnimals")}
          value={String(animalCount)}
          Icon={PawPrint}
          tone="green"
          delta={countDelta(animalsThisMonth)}
        />
        <StatCard
          href="/panel/tarlalar"
          label={t("fields")}
          value={String(fieldCount)}
          Icon={Wheat}
          tone="amber"
          delta={countDelta(fieldsThisMonth)}
        />
        <StatCard
          href="/panel/finans"
          label={t("netBalance")}
          value={formatMoney(balance)}
          Icon={Wallet}
          tone="sky"
          valueClass={balance >= 0 ? "text-green-600" : "text-red-600"}
          delta={moneyDelta(monthNet, formatMoney)}
        />
        <StatCard
          href="/panel/gorevler"
          label={t("openTasks")}
          value={String(pendingTasks)}
          Icon={ListChecks}
          tone="violet"
          delta={overdueDelta(overdueTasks.length)}
        />
      </div>

      {/* Aylik gelir-gider grafigi */}
      <MonthlyFinanceChart data={monthlyFinance} />

      {/* Uyarilar */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">{t("alerts")}</h2>

        {!hasAlerts ? (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            {t("noAlerts")}
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <AlertCard
              title={t("criticalStock")}
              icon="📦"
              emptyText={t("noCriticalStock")}
              hasItems={criticalItems.length > 0}
            >
              {criticalItems.map((i) => (
                <li key={i.id} className="flex justify-between">
                  <span className="text-foreground">{i.name}</span>
                  <span className="font-medium text-red-600">
                    {i.quantity} {i.unit}
                  </span>
                </li>
              ))}
            </AlertCard>

            <AlertCard
              title={t("overdueTasks")}
              icon="⏰"
              emptyText={t("noOverdueTasks")}
              hasItems={overdueTasks.length > 0}
            >
              {overdueTasks.map((t) => (
                <li key={t.id} className="flex justify-between">
                  <span className="text-foreground">{t.title}</span>
                  <span className="font-medium text-red-600">
                    {t.dueDate ? formatDate(t.dueDate) : "-"}
                  </span>
                </li>
              ))}
            </AlertCard>

            <AlertCard
              title={t("upcomingVaccinations")}
              icon="💉"
              emptyText={t("noUpcomingVaccinations")}
              hasItems={upcomingVaccinations.length > 0}
            >
              {upcomingVaccinations.map((v) => (
                <li key={v.id} className="flex justify-between">
                  <span className="text-foreground">
                    {v.animal.name ?? v.animal.tagNumber} · {v.name}
                  </span>
                  <span className="font-medium text-yellow-700">
                    {v.nextDate ? formatDate(v.nextDate) : "-"}
                  </span>
                </li>
              ))}
            </AlertCard>
          </div>
        )}
      </section>
    </div>
  );
}
