import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function formatMoney(amount: number): string {
  return amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 }) + " TL";
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("tr-TR");
}

// Ozet kart bileseni
function StatCard({
  href,
  label,
  value,
  valueClass = "text-gray-900",
}: {
  href: string;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-gray-200 bg-white p-5 transition hover:border-green-400 hover:shadow-sm"
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${valueClass}`}>{value}</p>
    </Link>
  );
}

export default async function PanelPage() {
  const session = await auth();
  const now = new Date();
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);

  // Tum ozet verilerini tek seferde paralel cekiyoruz
  const [
    animalCount,
    fieldCount,
    transactions,
    pendingTasks,
    inventoryItems,
    overdueTasks,
    upcomingVaccinations,
  ] = await Promise.all([
    prisma.animal.count({ where: { status: "ACTIVE" } }),
    prisma.field.count(),
    prisma.transaction.findMany({ select: { type: true, amount: true } }),
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

  const totalIncome = transactions
    .filter((t) => t.type === "INCOME")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === "EXPENSE")
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const criticalItems = inventoryItems.filter(
    (i) => i.quantity <= i.criticalLevel
  );

  const hasAlerts =
    criticalItems.length > 0 ||
    overdueTasks.length > 0 ||
    upcomingVaccinations.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel</h1>
        <p className="text-gray-600">
          Hos geldin, <strong>{session?.user.name}</strong>.
        </p>
      </div>

      {/* Ozet kartlari */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          href="/panel/hayvanlar"
          label="Aktif Hayvan"
          value={String(animalCount)}
        />
        <StatCard href="/panel/tarlalar" label="Tarla" value={String(fieldCount)} />
        <StatCard
          href="/panel/finans"
          label="Net Bakiye"
          value={formatMoney(balance)}
          valueClass={balance >= 0 ? "text-green-600" : "text-red-600"}
        />
        <StatCard
          href="/panel/gorevler"
          label="Acik Gorev"
          value={String(pendingTasks)}
        />
      </div>

      {/* Uyarilar */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Uyarilar</h2>

        {!hasAlerts ? (
          <p className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500">
            Aktif uyari yok. Her sey yolunda gorunuyor.
          </p>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Kritik stok */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-gray-900">Kritik Stok</h3>
              {criticalItems.length === 0 ? (
                <p className="text-sm text-gray-500">Kritik stok yok.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {criticalItems.map((i) => (
                    <li key={i.id} className="flex justify-between">
                      <span className="text-gray-700">{i.name}</span>
                      <span className="font-medium text-red-600">
                        {i.quantity} {i.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Geciken gorevler */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-gray-900">Geciken Gorevler</h3>
              {overdueTasks.length === 0 ? (
                <p className="text-sm text-gray-500">Geciken gorev yok.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {overdueTasks.map((t) => (
                    <li key={t.id} className="flex justify-between">
                      <span className="text-gray-700">{t.title}</span>
                      <span className="font-medium text-red-600">
                        {t.dueDate ? formatDate(t.dueDate) : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Yaklasan asilar */}
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="mb-3 font-semibold text-gray-900">Yaklasan Asilar</h3>
              {upcomingVaccinations.length === 0 ? (
                <p className="text-sm text-gray-500">Yaklasan asi yok.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {upcomingVaccinations.map((v) => (
                    <li key={v.id} className="flex justify-between">
                      <span className="text-gray-700">
                        {v.animal.name ?? v.animal.tagNumber} · {v.name}
                      </span>
                      <span className="font-medium text-yellow-700">
                        {v.nextDate ? formatDate(v.nextDate) : "-"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
