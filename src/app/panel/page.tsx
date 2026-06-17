import Link from "next/link";
import { PawPrint, Wheat, Wallet, ListChecks } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { buildMonthlyFinance } from "@/lib/finance";
import { MonthlyFinanceChart } from "@/components/monthly-finance-chart";
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

function StatCard({
  href,
  label,
  value,
  Icon,
  tone = "green",
  valueClass = "text-foreground",
}: {
  href: string;
  label: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  tone?: keyof typeof statTones;
  valueClass?: string;
}) {
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
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  // Grafik yalnizca son 6 ayi gosterir; bu yuzden tum islemleri degil,
  // sadece bu pencereyi cekiyoruz. Toplamlar ise aggregate ile hesaplanir.
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

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
  ] = await Promise.all([
    prisma.animal.count({ where: { status: "ACTIVE" } }),
    prisma.field.count(),
    // Tum zamanlarin gelir/gider toplamlari (kayitlari belleğe cekmeden)
    prisma.transaction.groupBy({ by: ["type"], _sum: { amount: true } }),
    // Grafik icin yalnizca son 6 ayin islemleri
    prisma.transaction.findMany({
      where: { date: { gte: sixMonthsAgo } },
      select: { type: true, amount: true, date: true },
    }),
    prisma.task.count({ where: { status: { not: "DONE" } } }),
    prisma.inventoryItem.findMany(),
    prisma.task.findMany({
      where: { status: { not: "DONE" }, dueDate: { lt: now } },
      include: { assignedTo: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.vaccination.findMany({
      where: { nextDate: { gte: now, lte: in30Days } },
      include: { animal: { select: { tagNumber: true, name: true } } },
      orderBy: { nextDate: "asc" },
    }),
  ]);

  const totalIncome =
    totalsByType.find((t) => t.type === "INCOME")?._sum.amount ?? 0;
  const totalExpense =
    totalsByType.find((t) => t.type === "EXPENSE")?._sum.amount ?? 0;
  const balance = totalIncome - totalExpense;

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
        <h1 className="text-2xl font-bold text-foreground">Panel</h1>
        <p className="text-muted-foreground">
          Hos geldin, <strong>{session?.user.name}</strong>.
        </p>
      </div>

      {/* Ozet kartlari */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/panel/hayvanlar"
          label="Aktif Hayvan"
          value={String(animalCount)}
          Icon={PawPrint}
          tone="green"
        />
        <StatCard
          href="/panel/tarlalar"
          label="Tarla"
          value={String(fieldCount)}
          Icon={Wheat}
          tone="amber"
        />
        <StatCard
          href="/panel/finans"
          label="Net Bakiye"
          value={formatMoney(balance)}
          Icon={Wallet}
          tone="sky"
          valueClass={balance >= 0 ? "text-green-600" : "text-red-600"}
        />
        <StatCard
          href="/panel/gorevler"
          label="Acik Gorev"
          value={String(pendingTasks)}
          Icon={ListChecks}
          tone="violet"
        />
      </div>

      {/* Aylik gelir-gider grafigi */}
      <MonthlyFinanceChart data={monthlyFinance} />

      {/* Uyarilar */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">Uyarilar</h2>

        {!hasAlerts ? (
          <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
            Aktif uyari yok. Her sey yolunda gorunuyor.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <AlertCard
              title="Kritik Stok"
              icon="📦"
              emptyText="Kritik stok yok."
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
              title="Geciken Gorevler"
              icon="⏰"
              emptyText="Geciken gorev yok."
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
              title="Yaklasan Asilar"
              icon="💉"
              emptyText="Yaklasan asi yok."
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
