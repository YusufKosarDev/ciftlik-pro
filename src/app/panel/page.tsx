import { auth } from "@/lib/auth";
import { withTenant } from "@/lib/tenant-prisma";
import { buildMonthlyFinance } from "@/lib/finance";
import { MonthlyFinanceChart } from "@/components/monthly-finance-chart";
import { DashboardCards } from "@/components/dashboard-cards";
import { getTranslations, getLocale } from "next-intl/server";
import { countDelta, moneyDelta, overdueDelta, type StatDelta, type DeltaTone } from "@/lib/stat-delta";
import { formatMoney, formatDate } from "@/lib/format";

function resolveDelta(
  delta: StatDelta,
  t: (key: string, values?: { count?: number; amount?: string }) => string,
  locale: string
): { label: string; tone: DeltaTone } {
  return {
    label: t(delta.labelKey, {
      count: delta.count,
      amount: delta.amount !== undefined ? formatMoney(delta.amount, locale) : undefined,
    }),
    tone: delta.tone,
  };
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
  const locale = await getLocale();
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
      db.$queryRaw<Array<{ id: string; name: string; quantity: number; criticalLevel: number; unit: string }>>`
        SELECT id, name, quantity, "criticalLevel", unit
        FROM "InventoryItem"
        WHERE quantity <= "criticalLevel"
      `,
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

  const criticalItems = inventoryItems;

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

      {/* Ozet kartlari (Client Component - Özelleştirilebilir) */}
      <DashboardCards
        animalCount={animalCount}
        animalsDelta={resolveDelta(countDelta(animalsThisMonth), t, locale)}
        fieldCount={fieldCount}
        fieldsDelta={resolveDelta(countDelta(fieldsThisMonth), t, locale)}
        balance={balance}
        balanceFormatted={formatMoney(balance, locale)}
        balanceDelta={resolveDelta(moneyDelta(monthNet), t, locale)}
        pendingTasks={pendingTasks}
        tasksDelta={resolveDelta(overdueDelta(overdueTasks.length), t, locale)}
        labels={{
          activeAnimals: t("activeAnimals"),
          fields: t("fields"),
          netBalance: t("netBalance"),
          openTasks: t("openTasks"),
        }}
      />

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
                    {t.dueDate ? formatDate(t.dueDate, locale) : "-"}
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
                    {v.nextDate ? formatDate(v.nextDate, locale) : "-"}
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
